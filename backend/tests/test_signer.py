import pytest
from core.signer import AgentSigner
import os
import types

def test_signer_type_safety(monkeypatch):
    monkeypatch.setenv("AGENT_PRIVATE_KEY", "0x" + "1"*64)
    signer = AgentSigner()
    with pytest.raises(TypeError):
        signer.sign_trade_intent(123, 1.0, "reason")
    with pytest.raises(TypeError):
        signer.sign_trade_intent("BUY", "bad", "reason")
    with pytest.raises(TypeError):
        signer.sign_trade_intent("BUY", 1.0, 123)

def test_signer_env_missing(monkeypatch):
    monkeypatch.delenv("AGENT_PRIVATE_KEY", raising=False)
    with pytest.raises(ValueError):
        AgentSigner()
