import os
import json
import logging
import time
from typing import Dict, Any
from ollama import AsyncClient

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)


class SentryBrain:
    def __init__(self):
        self.host = os.getenv("OLLAMA_HOST", "https://api.ollama.com")
        self.api_key = os.getenv("OLLAMA_API_KEY")
        self.model = os.getenv("OLLAMA_MODEL", "llama3.1")
        
        # Response cache
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 30  # Cache LLM responses for 30 seconds
        
        # Initialize client with the Cloud Bearer Token
        self.client = AsyncClient(
            host=self.host,
            headers={
                'Authorization': f'Bearer {self.api_key}'
            }
        )
        
        # Fallback decision (conservative)
        self.fallback_decision = {
            "action": "HOLD", 
            "amount": 0, 
            "reasoning": "LLM unavailable – using safe fallback conservative strategy"
        }

    def _get_cache(self, key: str) -> Dict[str, Any] | None:
        """Get cached decision if still valid"""
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.cache_ttl:
                logger.info(f"Decision cache hit: {key}")
                return entry["data"]
            else:
                del self.cache[key]
        return None

    def _set_cache(self, key: str, data: Dict[str, Any]):
        """Cache LLM decision"""
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }

    async def decide_trade(self, macro_data: dict, crypto_data: dict):
        """Decide trade action using LLM with fallback support"""
        
        # Create cache key from input data
        cache_key = f"{macro_data.get('volatility')}_{crypto_data.get('sentiment')}"
        
        # Check cache first
        cached = self._get_cache(cache_key)
        if cached:
            return json.dumps(cached)
        
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
            
            result = response['message']['content'].strip()
            
            # Remove markdown code block if present
            if result.startswith('```json'):
                result = result[7:]  # Remove ```json
            if result.startswith('```'):
                result = result[3:]  # Remove ```
            if result.endswith('```'):
                result = result[:-3]  # Remove trailing ```
            
            result = result.strip()
            
            # Parse to validate it's valid JSON
            try:
                decision = json.loads(result)
                # Cache the decision
                self._set_cache(cache_key, decision)
                return json.dumps(decision)
            except json.JSONDecodeError as je:
                logger.error(f"LLM returned invalid JSON: {result} - Error: {str(je)}")
                return json.dumps(self.fallback_decision)
                
        except Exception as e:
            error_str = str(e).lower()
            
            # Handle specific errors
            if "404" in error_str or "not found" in error_str:
                logger.error(f"Model '{self.model}' not found. Available models may differ. Using fallback.")
                logger.warning(f"Full error: {str(e)}")
            elif "401" in error_str or "unauthorized" in error_str:
                logger.error(f"LLM API authentication failed. Check OLLAMA_API_KEY")
            elif "connection" in error_str or "timeout" in error_str:
                logger.error(f"LLM API connection error: {str(e)}")
            else:
                logger.error(f"LLM API error: {str(e)}")
            
            # Return fallback decision
            return json.dumps(self.fallback_decision)