from fastapi import APIRouter, Body
import os
from core.macrosentry_contract import MacroSentryContract

from dotenv import load_dotenv
load_dotenv()

# Load config from environment
PROVIDER_URL = os.getenv("PROVIDER_URL", "")
CONTRACT_ADDRESS = os.getenv("MACROSENTRY_CONTRACT_ADDRESS", "")
ABI_PATH = os.getenv("MACROSENTRY_CONTRACT_ABI", "core/MacroSentryAgent.abi.json")
PRIVATE_KEY = os.getenv("AGENT_PRIVATE_KEY", "")

router = APIRouter()

# Initialize contract instance
contract = MacroSentryContract(
    provider_url=PROVIDER_URL,
    contract_address=CONTRACT_ADDRESS,
    abi_path=ABI_PATH,
    private_key=PRIVATE_KEY
)

@router.post("/register_agent")
def register_agent():
    tx_hash = contract.register_agent()
    return {"tx_hash": tx_hash}

@router.post("/post_artifact")
def post_artifact(
    action: str = Body(...),
    amount: str = Body(...),
    reasoning_hash: str = Body(...),
    txId: str = Body(...),
    compliant: bool = Body(...)
):
    tx_hash = contract.post_artifact(action, amount, reasoning_hash, txId, compliant)
    return {"tx_hash": tx_hash}

@router.get("/reputation/{agent_address}")
def get_reputation(agent_address: str):
    rep = contract.get_reputation(agent_address)
    return {"reputation": rep}

@router.get("/artifacts/{agent_address}")
def get_artifacts(agent_address: str):
    artifacts = contract.get_artifacts(agent_address)
    return {"artifacts": artifacts}
