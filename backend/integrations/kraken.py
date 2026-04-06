import subprocess
import json
import uuid
import logging

logger = logging.getLogger(__name__)


class KrakenExecutor:
    def execute_trade(self, pair: str, side: str, amount: float):
        """
        Calls the Kraken CLI binary to execute a trade.
        Falls back to paper-trade simulation if CLI is not installed.
        """
        try:
            command = [
                "kraken-cli", "trade", side,
                "--pair", pair,
                "--amount", str(amount)
            ]
            result = subprocess.run(command, capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                raise RuntimeError(result.stderr or "kraken-cli returned non-zero exit code")
            output = result.stdout.strip()
            try:
                data = json.loads(output)
                order_id = data.get("order_id") or data.get("txid") or str(uuid.uuid4())
            except (json.JSONDecodeError, AttributeError):
                order_id = output or str(uuid.uuid4())
            return {"status": "success", "order_id": order_id, "output": output, "mode": "live"}
        except FileNotFoundError:
            # kraken-cli not installed — use paper trade simulation
            order_id = f"PAPER-{str(uuid.uuid4())[:8].upper()}"
            logger.warning(f"kraken-cli not found. Paper trading: {side} {amount} {pair} → {order_id}")
            return {"status": "success", "order_id": order_id, "output": "", "mode": "paper"}
        except Exception as e:
            logger.error(f"Kraken trade error: {e}")
            return {"status": "error", "message": str(e)}