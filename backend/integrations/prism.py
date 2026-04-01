import httpx
import os

from dotenv import load_dotenv
load_dotenv()


class PrismClient:
    def __init__(self):
        self.api_key = os.getenv("PRISM_API_KEY")
        self.base_url = "https://api.prismapi.ai"

    async def get_macro_risk(self, symbol: str = "SPY"):
        """Fetches volatility and risk metrics from PRISM"""
        headers = {"X-API-Key": self.api_key or ""}
        async with httpx.AsyncClient() as client:
            # Resolving symbol to PRISM ID and getting risk
            response = await client.get(f"{self.base_url}/risk/{symbol}", headers=headers)
            return response.json()

    async def get_trading_signal(self, symbol: str = "BTC"):
        """Fetches AI-driven market signals"""
        headers = {"X-API-Key": self.api_key or ""}
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/signals/{symbol}", headers=headers)
            return response.json()