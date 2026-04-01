from eth_account import Account
from eth_account.messages import encode_typed_data
import os

from typing import Optional
from dotenv import load_dotenv
load_dotenv()

class AgentSigner:
    def __init__(self):
        self.private_key: Optional[str] = os.getenv("AGENT_PRIVATE_KEY")
        if not self.private_key or not isinstance(self.private_key, str):
            raise ValueError("AGENT_PRIVATE_KEY must be set in environment and be a string.")
        self.account = Account.from_key(self.private_key)

    def sign_trade_intent(self, action: str, amount: float, reasoning: str) -> str:
        if not isinstance(action, str):
            raise TypeError("action must be a string")
        if not isinstance(amount, (int, float)):
            raise TypeError("amount must be a number")
        if not isinstance(reasoning, str):
            raise TypeError("reasoning must be a string")

        domain_data = {
            "name": "MacroSentry-Agent",
            "version": "1",
            "chainId": 8453,  # Example: Base L2
            "verifyingContract": "0x..." # Hackathon Risk Router
        }

        message_data = {
            "agent": self.account.address,
            "action": action,
            "amount": str(amount),
            "reasoning_hash": str(hash(reasoning)) # Simplified for example
        }

        # Structure this for EIP-712 (Typed Data)
        # Note: You'll define the 'types' based on the ERC-8004 spec
        # For now, we use ... as a placeholder for message_types
        message_types = {
            "TradeIntent": [
                {"name": "agent", "type": "address"},
                {"name": "action", "type": "string"},
                {"name": "amount", "type": "string"},
                {"name": "reasoning_hash", "type": "string"}
            ]
        }
        signable_msg = encode_typed_data(
            domain_data=domain_data,
            message_types=message_types,
            message_data=message_data
        )
        signed_msg = Account.sign_message(signable_msg, self.private_key)
        return signed_msg.signature.hex()