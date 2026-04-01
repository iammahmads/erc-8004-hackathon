import os
import json
from typing import List
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()


from typing import Optional, Dict, Any

class PerformanceTracker:
    def __init__(self, filename: str = "performance_log.json"):
        self.filename = filename
        if not os.path.exists(self.filename):
            with open(self.filename, "w") as f:
                json.dump({"trades": []}, f)

    def log_trade(self, pnl: float, equity: float, timestamp: Optional[str] = None) -> None:
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

    def get_metrics(self) -> Dict[str, float]:
        with open(self.filename, "r") as f:
            data = json.load(f)
        trades = data.get("trades", [])
        if not isinstance(trades, list):
            raise ValueError("trades must be a list")
        if not trades:
            return {"sharpe": 0.0, "drawdown": 0.0, "returns": 0.0}
        returns = [float(t["pnl"]) for t in trades if isinstance(t.get("pnl"), (int, float))]
        equity = [float(t["equity"]) for t in trades if isinstance(t.get("equity"), (int, float))]
        if not returns or not equity:
            return {"sharpe": 0.0, "drawdown": 0.0, "returns": 0.0}
        avg_return = sum(returns) / len(returns)
        std_return = (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5 if len(returns) > 1 else 0.0
        sharpe = avg_return / std_return if std_return else 0.0
        max_equity = max(equity)
        min_equity = min(equity)
        drawdown = (max_equity - min_equity) / max_equity if max_equity else 0.0
        return {"sharpe": sharpe, "drawdown": drawdown, "returns": sum(returns)}
