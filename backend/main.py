from core.contract_api import router as contract_router
from fastapi import FastAPI, HTTPException, Body

import json
from integrations.prism import PrismClient
from integrations.kraken import KrakenExecutor
from agents.brain import SentryBrain


app = FastAPI(title="Macro-Sentry Backend")
prism = PrismClient()
kraken = KrakenExecutor()

brain = SentryBrain()

app.include_router(contract_router)

@app.get("/status")
async def get_market_status():
    # Example: Check S&P 500 risk before trading BTC
    macro_risk = await prism.get_macro_risk("SPY")
    btc_signal = await prism.get_trading_signal("BTC")
    
    return {
        "macro_volatility": macro_risk.get("volatility"),
        "sentiment": btc_signal.get("sentiment"),
        "action_recommendation": "HOLD" if macro_risk.get("volatility", 0) > 0.05 else "TRADE"
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
        "llm_decision": decision
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
    pair: str = Body(...),
    side: str = Body(...),
    amount: float = Body(...)
):
    """
    Executes a trade using Kraken CLI and returns the result.
    """
    result = kraken.execute_trade(pair, side, amount)
    if result["status"] != "success":
        raise HTTPException(status_code=500, detail=result.get("message", "Trade execution failed"))
    return result

from core.performance import PerformanceTracker
perf = PerformanceTracker()

# --- Phase 5: Performance & Social Build ---
@app.post("/log_trade")
async def log_trade(
    pnl: float = Body(...),
    equity: float = Body(...),
    timestamp: str = Body(None)
):
    perf.log_trade(pnl, equity, timestamp)
    return {"status": "logged"}

@app.get("/metrics")
async def get_metrics():
    return perf.get_metrics()