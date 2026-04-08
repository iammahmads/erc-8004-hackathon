from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Body, HTTPException
from web3 import Web3

from core.macrosentry_contract import MacroSentryContract

load_dotenv()

router = APIRouter()

def _onchain_enabled() -> bool:
    return os.getenv("ONCHAIN_MODE", "off").lower() in ("1", "true", "on", "yes")


def _get_config() -> Dict[str, str]:
    return {
        "provider_url": os.getenv("PROVIDER_URL", ""),
        "contract_address": os.getenv("MACROSENTRY_CONTRACT_ADDRESS", ""),
        "abi_path": os.getenv("MACROSENTRY_CONTRACT_ABI", "core/MacroSentryAgent.abi.json"),
        "private_key": os.getenv("AGENT_PRIVATE_KEY", ""),
    }


def _get_contract(*, require_onchain: bool) -> MacroSentryContract:
    cfg = _get_config()
    if require_onchain:
        if not _onchain_enabled():
            raise HTTPException(status_code=503, detail="ONCHAIN_MODE is off")

    if not cfg["provider_url"]:
        raise HTTPException(status_code=503, detail="PROVIDER_URL is not configured")
    if not cfg["contract_address"]:
        raise HTTPException(status_code=503, detail="MACROSENTRY_CONTRACT_ADDRESS is not configured")
    if not cfg["private_key"]:
        raise HTTPException(status_code=503, detail="AGENT_PRIVATE_KEY is not configured")
    if not os.path.exists(cfg["abi_path"]):
        raise HTTPException(status_code=503, detail=f"Contract ABI not found at {cfg['abi_path']}")

    try:
        return MacroSentryContract(
            provider_url=cfg["provider_url"],
            contract_address=cfg["contract_address"],
            abi_path=cfg["abi_path"],
            private_key=cfg["private_key"],
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to initialize contract: {e}")

@router.post("/register_agent")
def register_agent() -> Dict[str, str]:
    """
    Mint/register the agent identity NFT on-chain (ERC-8004 identity signal).
    """
    contract = _get_contract(require_onchain=True)
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
    """
    Post a validation artifact for a trade/checkpoint (ERC-8004 validation signal).
    """
    contract = _get_contract(require_onchain=True)
    tx_hash = contract.post_artifact(action, amount, reasoning_hash, txId, compliant)
    return {"tx_hash": tx_hash}

@router.get("/reputation/{agent_address}")
def get_reputation(agent_address: str) -> Dict[str, Any]:
    """
    Return a demo-friendly reputation object for the frontend.

    Note: the underlying contract method returns a single integer; we interpret it as
    the count of compliant trades (per backend/README.md) and derive a simple score.
    """
    # Demo-friendly: in paper mode we still return a valid shape for the UI.
    if not _onchain_enabled():
        return {
            "address": Web3.to_checksum_address(agent_address),
            "compliant_trades": 0,
            "total_trades": 0,
            "reputation_score": 0,
            "nft_id": None,
            "mint_date": None,
        }

    contract = _get_contract(require_onchain=True)
    rep = int(contract.get_reputation(agent_address))
    artifacts = contract.get_artifacts(agent_address) or []

    total_trades = len(artifacts) if isinstance(artifacts, (list, tuple)) else 0
    compliant_trades = rep
    reputation_score = int(min(100, (compliant_trades / max(total_trades, 1)) * 100))

    return {
        "address": Web3.to_checksum_address(agent_address),
        "compliant_trades": compliant_trades,
        "total_trades": total_trades,
        "reputation_score": reputation_score,
        "nft_id": None,
        "mint_date": None,
    }

@router.get("/artifacts/{agent_address}")
def get_artifacts(agent_address: str) -> List[Dict[str, Any]]:
    """
    Return artifacts as an array (what the frontend expects).
    """
    # Demo-friendly: in paper mode return empty artifacts (UI still works).
    if not _onchain_enabled():
        return []

    contract = _get_contract(require_onchain=True)
    artifacts = contract.get_artifacts(agent_address) or []

    normalized: List[Dict[str, Any]] = []
    if isinstance(artifacts, (list, tuple)):
        for idx, a in enumerate(artifacts):
            if isinstance(a, dict):
                normalized.append(a)
            elif isinstance(a, (list, tuple)):
                # Best-effort mapping for tuple-style returns from Solidity
                normalized.append(
                    {
                        "id": str(idx),
                        "action": a[0] if len(a) > 0 else "",
                        "amount": a[1] if len(a) > 1 else "",
                        "reasoning_hash": a[2] if len(a) > 2 else "",
                        "txId": a[3] if len(a) > 3 else "",
                        "compliant": bool(a[4]) if len(a) > 4 else True,
                        "timestamp": a[5] if len(a) > 5 else "",
                        "block_number": a[6] if len(a) > 6 else None,
                    }
                )
            else:
                normalized.append({"id": str(idx), "value": a})
    return normalized
