import subprocess
import json


class KrakenExecutor:
    def execute_trade(self, pair: str, side: str, amount: float):
        """
        Calls the Kraken CLI binary to execute a trade.
        Requires the Kraken CLI to be installed and configured.
        """
        try:
            command = [
                "kraken-cli", "trade", side,
                "--pair", pair,
                "--amount", str(amount)
            ]
            # Capture the output to send back to the Next.js dashboard
            result = subprocess.run(command, capture_output=True, text=True)
            return {"status": "success", "output": result.stdout}
        except Exception as e:
            return {"status": "error", "message": str(e)}