import os
import json
from web3 import Web3
from eth_account import Account
from typing import Any, Dict

from dotenv import load_dotenv
load_dotenv()

class MacroSentryContract:
    def __init__(self, provider_url: str, contract_address: str, abi_path: str, private_key: str):
        self.web3 = Web3(Web3.HTTPProvider(provider_url))
        with open(abi_path, "r") as f:
            self.abi = json.load(f)
        self.contract = self.web3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=self.abi)
        self.account = Account.from_key(private_key)

    def register_agent(self, agent_address: str = None) -> str:
        from_address = agent_address if agent_address else self.account.address
        tx = self.contract.functions.registerAgent().build_transaction({
            'from': from_address,
            'nonce': self.web3.eth.get_transaction_count(self.account.address),
            'gas': 300000,
            'gasPrice': self.web3.eth.gas_price
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed.raw_transaction)
        return self.web3.to_hex(tx_hash)

    def post_artifact(self, action: str, amount: str, reasoning_hash: str, txId: str, compliant: bool) -> str:
        tx = self.contract.functions.postArtifact(
            action, amount, reasoning_hash, txId, compliant
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.web3.eth.get_transaction_count(self.account.address),
            'gas': 300000,
            'gasPrice': self.web3.eth.gas_price
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
        return self.web3.to_hex(tx_hash)

    def get_reputation(self, agent_address: str) -> int:
        return self.contract.functions.getReputation(agent_address).call()

    def get_artifacts(self, agent_address: str) -> Any:
        return self.contract.functions.getArtifacts(agent_address).call()
