import httpx
import os
import json
import logging
import time
from typing import Dict, Any

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)


class PrismClient:
    def __init__(self):
        self.api_key = os.getenv("PRISM_API_KEY")
        self.base_url = "https://api.prismapi.ai"
        self.timeout = 10.0  # 10 second timeout
        
        # Rate limiting cache
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 60  # Cache for 60 seconds
        
        # Default fallback responses for when API is unavailable
        self.default_macro_risk = {
            "volatility": 0.15,
            "sentiment": "neutral",
            "price": 0,
            "trend": "stable"
        }
        self.default_trading_signal = {
            "sentiment": "neutral",
            "volatility": 0.12,
            "price": 65000,
            "trend": "sideways"
        }

    def _get_cache(self, key: str) -> Dict[str, Any] | None:
        """Get cached data if still valid"""
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.cache_ttl:
                logger.info(f"Cache hit for {key}")
                return entry["data"]
            else:
                del self.cache[key]
        return None

    def _set_cache(self, key: str, data: Dict[str, Any]):
        """Cache API response"""
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }

    async def get_macro_risk(self, symbol: str = "SPY"):
        """Fetches volatility and risk metrics from PRISM"""
        cache_key = f"macro_risk_{symbol}"
        
        # Check cache first
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            headers = {"X-API-Key": self.api_key or ""}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/risk/{symbol}", 
                    headers=headers
                )
                
                # Handle rate limiting (429)
                if response.status_code == 429:
                    logger.warning(f"Rate limited (429) for {symbol}. Using cached/fallback data.")
                    return self.default_macro_risk
                
                # Check for HTTP errors
                if response.status_code != 200:
                    logger.warning(f"PRISM API error for {symbol}: HTTP {response.status_code}")
                    return self.default_macro_risk
                
                data = response.json()
                
                # Check for API error responses
                if "error" in data:
                    logger.warning(f"PRISM API error for {symbol}: {data.get('error')}")
                    return self.default_macro_risk
                
                # Extract key fields and normalize response
                result = {
                    "volatility": data.get("annual_volatility", 0) / 100,  # Convert to decimal
                    "sentiment": "neutral",
                    "price": 0,
                    "trend": "stable"
                }
                
                # Cache the result
                self._set_cache(cache_key, result)
                return result
                
        except httpx.TimeoutException:
            logger.error(f"PRISM API timeout for {symbol}, using fallback")
            return self.default_macro_risk
        except Exception as e:
            logger.error(f"PRISM API error for {symbol}: {str(e)}")
            return self.default_macro_risk

    async def get_trading_signal(self, symbol: str = "BTC"):
        """Fetches AI-driven market signals"""
        cache_key = f"trading_signal_{symbol}"
        
        # Check cache first
        cached = self._get_cache(cache_key)
        if cached:
            return cached
        
        try:
            headers = {"X-API-Key": self.api_key or ""}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/signals/{symbol}", 
                    headers=headers,
                    follow_redirects=True
                )
                
                # Handle rate limiting (429)
                if response.status_code == 429:
                    logger.warning(f"Rate limited (429) for signals/{symbol}. Using cached/fallback data.")
                    return self.default_trading_signal
                
                # Check for HTTP errors
                if response.status_code != 200:
                    logger.warning(f"PRISM signals error for {symbol}: HTTP {response.status_code}")
                    return self.default_trading_signal
                
                data = response.json()
                
                # Check for API error responses (including rate limiting)
                if "error" in data:
                    if data.get("error") == "rate_limit_exceeded":
                        logger.warning(f"Rate limited (API response) for signals/{symbol}")
                    else:
                        logger.warning(f"PRISM signals error for {symbol}: {data.get('error')}")
                    return self.default_trading_signal
                
                # Parse sentiment and volatility
                sentiment = data.get("sentiment", "neutral").lower()
                if sentiment not in ["bullish", "bearish", "neutral"]:
                    sentiment = "neutral"
                
                result = {
                    "sentiment": sentiment,
                    "volatility": data.get("volatility", 0.12),
                    "price": data.get("price", 0),
                    "trend": data.get("trend", "sideways")
                }
                
                # Cache the result
                self._set_cache(cache_key, result)
                return result
                
        except httpx.TimeoutException:
            logger.error(f"PRISM signals timeout for {symbol}, using fallback")
            return self.default_trading_signal
        except Exception as e:
            logger.error(f"PRISM signals error for {symbol}: {str(e)}")
            return self.default_trading_signal