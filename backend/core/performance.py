import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from dotenv import load_dotenv
load_dotenv()


class PerformanceTracker:
    def __init__(self, filename: str = "performance_log.json"):
        self.filename = filename
        if not os.path.exists(self.filename):
            with open(self.filename, "w") as f:
                json.dump({"trades": []}, f)

    def log_trade(self, pnl: float, equity: float, timestamp: Optional[str] = None) -> None:
        """Legacy method for backward compatibility"""
        if not isinstance(pnl, (int, float)):
            raise TypeError("pnl must be a number")
        if not isinstance(equity, (int, float)):
            raise TypeError("equity must be a number")
        if timestamp is not None and not isinstance(timestamp, str):
            raise TypeError("timestamp must be a string or None")
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat()
        with open(self.filename, "r+") as f:
            data = json.load(f)
            data["trades"].append({"pnl": float(pnl), "equity": float(equity), "timestamp": timestamp})
            f.seek(0)
            json.dump(data, f)
            f.truncate()

    def add_trade(self, trade: Dict[str, Any]) -> str:
        """Add a complete trade object with all details"""
        if not isinstance(trade, dict):
            raise TypeError("trade must be a dictionary")
        
        # Generate trade ID if not provided
        trade_id = trade.get("id") or str(uuid.uuid4())
        trade_with_id = {**trade, "id": trade_id}
        
        with open(self.filename, "r+") as f:
            data = json.load(f)
            if "detailed_trades" not in data:
                data["detailed_trades"] = []
            data["detailed_trades"].append(trade_with_id)
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()
        
        return trade_id

    def get_trades(self) -> List[Dict[str, Any]]:
        """Retrieve all detailed trades"""
        try:
            with open(self.filename, "r") as f:
                data = json.load(f)
            return data.get("detailed_trades", [])
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def update_trade(self, trade_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing trade"""
        try:
            with open(self.filename, "r+") as f:
                data = json.load(f)
                detailed_trades = data.get("detailed_trades", [])
                
                for trade in detailed_trades:
                    if trade.get("id") == trade_id:
                        trade.update(updates)
                        f.seek(0)
                        json.dump(data, f, indent=2)
                        f.truncate()
                        return True
                
                return False
        except (FileNotFoundError, json.JSONDecodeError):
            return False

    def delete_trade(self, trade_id: str) -> bool:
        """Delete a trade by ID"""
        try:
            with open(self.filename, "r+") as f:
                data = json.load(f)
                detailed_trades = data.get("detailed_trades", [])
                
                original_length = len(detailed_trades)
                data["detailed_trades"] = [t for t in detailed_trades if t.get("id") != trade_id]
                
                if len(data["detailed_trades"]) < original_length:
                    f.seek(0)
                    json.dump(data, f, indent=2)
                    f.truncate()
                    return True
                
                return False
        except (FileNotFoundError, json.JSONDecodeError):
            return False

    def get_metrics(self) -> Dict[str, float]:
        """Get performance metrics from legacy trade data"""
        try:
            with open(self.filename, "r") as f:
                data = json.load(f)
            trades = data.get("trades", [])
            if not isinstance(trades, list):
                raise ValueError("trades must be a list")
            if not trades:
                return {"sharpe_ratio": 0.0, "max_drawdown": 0.0, "total_return": 0.0}
            returns = [float(t["pnl"]) for t in trades if isinstance(t.get("pnl"), (int, float))]
            equity = [float(t["equity"]) for t in trades if isinstance(t.get("equity"), (int, float))]
            if not returns or not equity:
                return {"sharpe_ratio": 0.0, "max_drawdown": 0.0, "total_return": 0.0}
            avg_return = sum(returns) / len(returns)
            std_return = (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5 if len(returns) > 1 else 0.0
            sharpe = avg_return / std_return if std_return else 0.0
            max_equity = max(equity)
            min_equity = min(equity)
            drawdown = (max_equity - min_equity) / max_equity if max_equity else 0.0
            return {"sharpe_ratio": sharpe, "max_drawdown": drawdown, "total_return": sum(returns)}
        except (FileNotFoundError, json.JSONDecodeError):
            return {"sharpe_ratio": 0.0, "max_drawdown": 0.0, "total_return": 0.0}