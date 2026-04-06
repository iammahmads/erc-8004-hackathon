from core.contract_api import router as contract_router
from core.erc8004_api import router as erc8004_router
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

import json
from datetime import datetime
from integrations.prism import PrismClient
from integrations.kraken import KrakenExecutor
from agents.brain import SentryBrain


app = FastAPI(title="Macro-Sentry Backend")
prism = PrismClient()
kraken = KrakenExecutor()
brain = SentryBrain()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contract_router)
app.include_router(erc8004_router)

@app.get("/status")
async def get_market_status():
    """Health + market status overview for judges and demos."""
    import os
    macro_risk = await prism.get_macro_risk("SPY")
    btc_signal = await prism.get_trading_signal("BTC")

    agent_address = None
    try:
        from eth_account import Account
        pk = os.getenv("AGENT_PRIVATE_KEY", "")
        if pk:
            agent_address = Account.from_key(pk).address
    except Exception:
        pass

    return {
        "project": "Macro-Sentry Agent",
        "standard": "ERC-8004",
        "network": "Sepolia",
        "agent_address": agent_address,
        "erc8004_configured": bool(
            os.getenv("RISK_ROUTER_ADDRESS") and os.getenv("AGENT_REGISTRY_ADDRESS")
        ),
        "prism_configured": bool(os.getenv("PRISM_API_KEY")),
        "macro_volatility": macro_risk.get("volatility"),
        "btc_sentiment": btc_signal.get("sentiment"),
        "action_recommendation": "HOLD" if macro_risk.get("volatility", 0) > 0.05 else "TRADE",
    }


# --- Phase 2: Intelligence Engine Endpoint ---
@app.get("/decide_trade")
async def decide_trade():
    # 1. Gather macro and crypto data
    macro_data = await prism.get_macro_risk("DXY")  # US Dollar Index
    spx_data = await prism.get_macro_risk("SPY")    # S&P 500
    btc_signal = await prism.get_trading_signal("BTC")

    # 2. Macro-correlation logic & risk guardrails
    # Example rules:
    # - If DXY volatility > 0.07, reduce position size
    # - If PRISM signal for BTC is bullish and S&P 500 volatility < 0.03, go aggressive
    risk_mode = "normal"
    position_size = 1.0
    if macro_data.get("volatility", 0) > 0.07:
        risk_mode = "protection"
        position_size = 0.5
    if btc_signal.get("sentiment") == "bullish" and spx_data.get("volatility", 0) < 0.03:
        risk_mode = "aggressive"
        position_size = 1.5

    # 3. LLM decision module
    llm_input_macro = {
        "volatility": macro_data.get("volatility"),
        "risk_mode": risk_mode
    }
    llm_input_crypto = {
        "sentiment": btc_signal.get("sentiment"),
        "position_size": position_size
    }
    decision_json = await brain.decide_trade(llm_input_macro, llm_input_crypto)
    try:
        decision = json.loads(decision_json)
    except Exception:
        decision = {"action": "HOLD", "amount": 0, "reasoning": "LLM output error"}

    return {
        "macro": macro_data,
        "spx": spx_data,
        "btc_signal": btc_signal,
        "risk_mode": risk_mode,
        "llm_decision": decision,
        "timestamp": datetime.utcnow().isoformat()
    }


# --- Phase 3: Trust Layer (ERC-8004 Integration) ---
from core.signer import AgentSigner
signer = AgentSigner()

@app.post("/sign_intent")
async def sign_intent(
    action: str = Body(...),
    amount: float = Body(...),
    reasoning: str = Body(...)
):
    """
    Receives trade intent and returns EIP-712 signature (Validation Artifact).
    """
    signature = signer.sign_trade_intent(action, amount, reasoning)
    return {
        "action": action,
        "amount": amount,
        "reasoning": reasoning,
        "signature": signature
    }

# --- Phase 4: Execution & Automation ---
@app.post("/execute_trade")
async def execute_trade(
    action: str = Body(...),
    amount: float = Body(...)
):
    """
    Executes a trade on Kraken and returns the result.
    Action should be 'BUY' or 'SELL', amount in BTC
    """
    # Default to BTC/USD pair
    pair = "BTCUSD"
    side = "buy" if action.upper() == "BUY" else "sell"
    
    result = kraken.execute_trade(pair, side, amount)
    if result.get("status") != "success":
        raise HTTPException(status_code=500, detail=result.get("message", "Trade execution failed"))
    return {
        "order_id": result.get("order_id", "unknown"),
        "status": "success",
        "action": action,
        "amount": amount,
        "mode": result.get("mode", "live")
    }

from core.performance import PerformanceTracker
perf = PerformanceTracker()

# --- Phase 5: Performance & Social Build ---
@app.post("/log_trade")
async def log_trade(
    action: str = Body(...),
    amount: float = Body(...),
    entry_price: float = Body(...),
    exit_price: float = Body(None),
    status: str = Body(...),
    timestamp: str = Body(None),
    pnl: float = Body(None)
):
    """
    Logs a complete trade with all details.
    Action: BUY or SELL
    Amount: Size in BTC
    Entry_price: Entry price in USD
    Exit_price: Exit price in USD (optional for open trades)
    Status: 'open' or 'closed'
    Timestamp: ISO timestamp (auto-generated if not provided)
    PnL: Profit/Loss (auto-calculated if not provided)
    """
    if not timestamp:
        timestamp = datetime.utcnow().isoformat()
    
    # Auto-calculate PnL if not provided
    if pnl is None and exit_price and status == 'closed':
        entry_value = amount * entry_price
        exit_value = amount * exit_price
        pnl = (exit_value - entry_value) if action.upper() == 'BUY' else (entry_value - exit_value)
    else:
        pnl = pnl or 0
    
    trade_data = {
        "action": action.upper(),
        "amount": float(amount),
        "entry_price": float(entry_price),
        "exit_price": float(exit_price) if exit_price else None,
        "status": status.lower(),
        "timestamp": timestamp,
        "pnl": float(pnl)
    }
    
    trade_id = perf.add_trade(trade_data)
    return {"id": trade_id, "logged": True}

@app.get("/metrics")
async def get_metrics():
    return perf.get_metrics()

# --- Additional Endpoints for Frontend Integration ---
@app.get("/trades")
async def get_trade_history():
    """
    Returns detailed trade history from performance tracker
    """
    trades = perf.get_trades()
    return trades

@app.patch("/trades/{trade_id}")
async def update_trade(
    trade_id: str,
    exit_price: float = Body(None),
    status: str = Body(None)
):
    """
    Update a trade with exit price and/or status.
    Used for closing positions.
    """
    updates = {}
    if exit_price is not None:
        updates["exit_price"] = float(exit_price)
    if status is not None:
        updates["status"] = status.lower()
    
    # Recalculate PnL if we have exit price and action
    if updates:
        trades = perf.get_trades()
        for trade in trades:
            if trade.get("id") == trade_id:
                # Use the trade data to recalculate
                if "exit_price" in updates and "action" in trade:
                    entry_value = trade.get("amount", 0) * trade.get("entry_price", 0)
                    exit_value = trade.get("amount", 0) * updates["exit_price"]
                    pnl = (exit_value - entry_value) if trade["action"] == "BUY" else (entry_value - exit_value)
                    updates["pnl"] = pnl
                
                # Update status to closed if exit_price is provided
                if "exit_price" in updates:
                    updates["status"] = "closed"
                
                break
    
    success = perf.update_trade(trade_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail=f"Trade {trade_id} not found")
    
    return {"id": trade_id, "updated": True, "updates": updates}

@app.delete("/trades/{trade_id}")
async def delete_trade(trade_id: str):
    """
    Delete a trade by ID
    """
    success = perf.delete_trade(trade_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Trade {trade_id} not found")
    
    return {"id": trade_id, "deleted": True}

@app.post("/register_agent")
async def register_agent():
    """
    Registers the agent NFT on-chain
    """
    try:
        # This would call the contract API to mint NFT
        from core.contract_api import register_agent as contract_register
        result = contract_register()
        return {
            "nft_id": result.get("nft_id", "NFT#001"),
            "tx_hash": result.get("tx_hash", "0x" + "0" * 64)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent registration failed: {str(e)}")


# --- Auto-Trade: Full Autonomous Pipeline ---
@app.post("/auto-trade")
async def auto_trade():
    """
    Full ERC-8004 autonomous trading pipeline:
    1. Fetch PRISM signals
    2. LLM decides action (BUY/SELL/HOLD)
    3. If not HOLD: sign intent (EIP-712), execute on Kraken, log trade
    Returns the full pipeline result for frontend display.
    """
    timestamp = datetime.utcnow().isoformat()

    # Step 1: Gather signals
    macro_data = await prism.get_macro_risk("DXY")
    spx_data = await prism.get_macro_risk("SPY")
    btc_signal = await prism.get_trading_signal("BTC")

    # Step 2: Risk guardrails
    risk_mode = "normal"
    position_size = 0.001  # Small safe default (0.001 BTC)
    if macro_data.get("volatility", 0) > 0.07:
        risk_mode = "protection"
        position_size = 0.0005
    if btc_signal.get("sentiment") == "bullish" and spx_data.get("volatility", 0) < 0.03:
        risk_mode = "aggressive"
        position_size = 0.002

    # Step 3: LLM decision
    llm_decision_json = await brain.decide_trade(
        {"volatility": macro_data.get("volatility"), "risk_mode": risk_mode},
        {"sentiment": btc_signal.get("sentiment"), "position_size": position_size}
    )
    try:
        decision = json.loads(llm_decision_json)
    except Exception:
        decision = {"action": "HOLD", "amount": 0, "reasoning": "LLM parse error"}

    action = decision.get("action", "HOLD").upper()
    pipeline_result: dict = {
        "timestamp": timestamp,
        "signals": {"macro": macro_data, "spx": spx_data, "btc": btc_signal},
        "risk_mode": risk_mode,
        "decision": decision,
        "action": action,
        "executed": False,
        "trade_id": None,
        "order_id": None,
        "mode": "paper",
    }

    if action == "HOLD":
        pipeline_result["message"] = "Agent decided to HOLD. No trade executed."
        return pipeline_result

    # Step 4: Sign intent (EIP-712)
    try:
        signature = signer.sign_trade_intent(action, position_size, decision.get("reasoning", ""))
        pipeline_result["signature"] = signature
    except Exception as e:
        pipeline_result["message"] = f"Signing failed: {e}"
        return pipeline_result

    # Step 5: Execute trade on Kraken
    pair = "BTCUSD"
    side = "buy" if action == "BUY" else "sell"
    kraken_result = kraken.execute_trade(pair, side, position_size)
    if kraken_result.get("status") != "success":
        pipeline_result["message"] = f"Execution failed: {kraken_result.get('message')}"
        return pipeline_result

    order_id = kraken_result.get("order_id", "unknown")
    mode = kraken_result.get("mode", "paper")
    pipeline_result["order_id"] = order_id
    pipeline_result["mode"] = mode

    # Step 6: Log trade
    entry_price = btc_signal.get("price") or 65000.0
    trade_data = {
        "action": action,
        "amount": float(position_size),
        "entry_price": float(entry_price),
        "status": "open",
        "timestamp": timestamp,
        "pnl": 0.0,
        "order_id": order_id,
        "mode": mode,
        "reasoning": decision.get("reasoning", ""),
    }
    trade_id = perf.add_trade(trade_data)
    pipeline_result["trade_id"] = trade_id
    pipeline_result["executed"] = True
    pipeline_result["message"] = (
        f"{action} {position_size} BTC via {mode} trade. Order: {order_id}"
    )

    return pipeline_result