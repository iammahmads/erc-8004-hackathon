import os

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def _erc8004_configured() -> bool:
    # Never hit real RPC endpoints in CI/sandbox runs unless explicitly enabled.
    if os.getenv("RUN_ONCHAIN_TESTS", "0").lower() not in ("1", "true", "on", "yes"):
        return False

    abi_path = os.getenv("MACROSENTRY_CONTRACT_ABI", "core/MacroSentryAgent.abi.json")
    return bool(
        os.getenv("PROVIDER_URL")
        and os.getenv("MACROSENTRY_CONTRACT_ADDRESS")
        and os.getenv("AGENT_PRIVATE_KEY")
        and os.path.exists(os.path.join(os.path.dirname(__file__), "..", abi_path))
    )


def test_register_agent():
    resp = client.post("/register_agent")
    if _erc8004_configured():
        assert resp.status_code == 200
        assert "tx_hash" in resp.json()
    else:
        assert resp.status_code == 503


def test_post_artifact():
    data = {
        "action": "BUY",
        "amount": "0.01",
        "reasoning_hash": "0x1234567890abcdef",
        "txId": "kraken_tx_001",
        "compliant": True,
    }
    resp = client.post("/post_artifact", json=data)
    if _erc8004_configured():
        assert resp.status_code == 200
        assert "tx_hash" in resp.json()
    else:
        assert resp.status_code == 503


def test_get_reputation():
    agent_address = os.getenv("AGENT_PUBLIC_ADDRESS") or "0x0000000000000000000000000000000000000000"
    resp = client.get(f"/reputation/{agent_address}")
    if _erc8004_configured():
        assert resp.status_code == 200
        body = resp.json()
        assert "address" in body
        assert "compliant_trades" in body
        assert "total_trades" in body
        assert "reputation_score" in body
    else:
        # In paper/demo mode we still return a valid UI-friendly object.
        assert resp.status_code == 200
        body = resp.json()
        assert body["compliant_trades"] == 0
        assert body["total_trades"] == 0


def test_get_artifacts():
    agent_address = os.getenv("AGENT_PUBLIC_ADDRESS") or "0x0000000000000000000000000000000000000000"
    resp = client.get(f"/artifacts/{agent_address}")
    if _erc8004_configured():
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
    else:
        # In paper/demo mode we still return a valid UI-friendly list.
        assert resp.status_code == 200
        assert resp.json() == []
