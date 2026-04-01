import os
import json
from ollama import AsyncClient

from dotenv import load_dotenv
load_dotenv()

class SentryBrain:
    def __init__(self):
        self.host = os.getenv("OLLAMA_HOST", "https://api.ollama.com")
        self.api_key = os.getenv("OLLAMA_API_KEY")
        self.model = os.getenv("OLLAMA_MODEL", "llama3.1")
        
        # Initialize client with the Cloud Bearer Token
        self.client = AsyncClient(
            host=self.host,
            headers={
                'Authorization': f'Bearer {self.api_key}'
            }
        )

    async def decide_trade(self, macro_data: dict, crypto_data: dict):
        system_prompt = """
        You are 'Macro-Sentry', an AI agent focused on risk-adjusted PnL.
        Output ONLY a JSON object: {"action": "BUY|SELL|HOLD", "amount": float, "reasoning": "string"}
        """

        user_content = f"Volatility: {macro_data.get('volatility')}, Sentiment: {crypto_data.get('sentiment')}"

        try:
            response = await self.client.chat(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_content},
                ],
                format="json" 
            )
            return response['message']['content']
        except Exception as e:
            # Fallback to safe mode if the cloud API is down
            return json.dumps({
                "action": "HOLD", 
                "amount": 0, 
                "reasoning": f"Cloud API Connectivity Error: {str(e)}"
            })