import pytest
import asyncio
import json
from agents.brain import SentryBrain

@pytest.mark.asyncio
async def test_decide_trade_bullish():
    brain = SentryBrain()
    macro_data = {"volatility": 0.02, "risk_mode": "normal"}
    crypto_data = {"sentiment": "bullish", "position_size": 1.0}
    result = await brain.decide_trade(macro_data, crypto_data)
    decision = json.loads(result)
    assert decision["action"] in ["BUY", "SELL", "HOLD"]
    assert isinstance(decision["amount"], (int, float))
    assert isinstance(decision["reasoning"], str)

@pytest.mark.asyncio
async def test_decide_trade_high_volatility():
    brain = SentryBrain()
    macro_data = {"volatility": 0.09, "risk_mode": "protection"}
    crypto_data = {"sentiment": "bearish", "position_size": 0.5}
    result = await brain.decide_trade(macro_data, crypto_data)
    decision = json.loads(result)
    assert decision["action"] in ["BUY", "SELL", "HOLD"]
    assert isinstance(decision["amount"], (int, float))
    assert isinstance(decision["reasoning"], str)

@pytest.mark.asyncio
async def test_decide_trade_llm_failure(monkeypatch):
    brain = SentryBrain()
    async def fail_chat(*args, **kwargs):
        raise Exception("LLM down")
    brain.client.chat = fail_chat
    macro_data = {"volatility": 0.01, "risk_mode": "normal"}
    crypto_data = {"sentiment": "neutral", "position_size": 1.0}
    result = await brain.decide_trade(macro_data, crypto_data)
    decision = json.loads(result)
    assert decision["action"] == "HOLD"
    assert decision["amount"] == 0
    assert "error" in decision["reasoning"].lower() or "safe" in decision["reasoning"].lower()
