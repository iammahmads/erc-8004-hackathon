import httpx
import pytest

BASE_URL = "http://127.0.0.1:8000"

@pytest.mark.order(1)
def test_register_agent():
    resp = httpx.post(f"{BASE_URL}/register_agent")
    assert resp.status_code == 200
    assert "tx_hash" in resp.json()
    print("register_agent tx_hash:", resp.json()["tx_hash"])

@pytest.mark.order(2)
def test_post_artifact():
    data = {
        "action": "BUY",
        "amount": "0.01",
        "reasoning_hash": "0x1234567890abcdef",
        "txId": "kraken_tx_001",
        "compliant": True
    }
    resp = httpx.post(f"{BASE_URL}/post_artifact", json=data)
    assert resp.status_code == 200
    assert "tx_hash" in resp.json()
    print("post_artifact tx_hash:", resp.json()["tx_hash"])

@pytest.mark.order(3)
def test_get_reputation():
    # Use the agent address from .env
    import os
    agent_address = os.getenv("AGENT_PUBLIC_ADDRESS")
    resp = httpx.get(f"{BASE_URL}/reputation/{agent_address}")
    assert resp.status_code == 200
    assert "reputation" in resp.json()
    print("reputation:", resp.json()["reputation"])

@pytest.mark.order(4)
def test_get_artifacts():
    import os
    agent_address = os.getenv("AGENT_PUBLIC_ADDRESS")
    resp = httpx.get(f"{BASE_URL}/artifacts/{agent_address}")
    assert resp.status_code == 200
    assert "artifacts" in resp.json()
    print("artifacts:", resp.json()["artifacts"])
