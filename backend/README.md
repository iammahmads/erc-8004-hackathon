# Macro-Sentry Agent

## Project Setup

1. Clone the repository and navigate to the backend directory:
   ```bash
   git clone <your-repo-url>
   cd backend
   ```

2. Create and activate a Python virtual environment (if not already present):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory and add your API keys:
   ```env
   PRISM_API_KEY=your_prism_key
   KRAKEN_API_KEY=your_kraken_key
   KRAKEN_API_SECRET=your_kraken_secret
   ERC8004_PRIVATE_KEY=your_wallet_private_key
   ...
   ```

5. Confirm Python version:
   - Python 3.12.3 (recommended)

6. Run the FastAPI server (if used):
   ```bash
   uvicorn main:app --reload
   ```

## Environment Variables
- Store all sensitive keys in the `.env` file.
- Never commit `.env` to version control.

## Directory Structure
- `main.py` — Entry point
- `agents/` — Agent logic (e.g., brain.py)
- `core/` — Core utilities (e.g., signer.py)
- `integrations/` — Exchange and API integrations (kraken.py, prism.py)


## API Endpoints

### 1. Register Agent
**POST /register_agent**

Registers your agent (mints ERC-721 identity NFT on-chain).

- **Request:** No body required.
- **Response:** `{ "tx_hash": "<transaction_hash>" }`

---

### 2. Post Validation Artifact
**POST /post_artifact**

Posts a trade validation artifact to the contract.

- **Request JSON:**
   ```json
   {
      "action": "BUY",
      "amount": "0.01",
      "reasoning_hash": "0x1234567890abcdef",
      "txId": "kraken_tx_001",
      "compliant": true
   }
   ```
- **Response:** `{ "tx_hash": "<transaction_hash>" }`

---

### 3. Get Reputation
**GET /reputation/{agent_address}**

Fetches the agent’s on-chain reputation (compliant trade count).

- **Response:** `{ "reputation": <int> }`

---

### 4. Get Artifacts
**GET /artifacts/{agent_address}**

Fetches all posted artifacts for an agent.

- **Response:** `{ "artifacts": [ ... ] }`

---

### 5. Decide Trade
**GET /decide_trade**

Runs the full macro/crypto analysis and LLM decision logic, returning a trade intent and reasoning.

- **Response:**
   ```json
   {
      "macro": { ... },
      "spx": { ... },
      "btc_signal": { ... },
      "risk_mode": "normal|protection|aggressive",
      "llm_decision": { "action": "BUY|SELL|HOLD", "amount": float, "reasoning": "string" }
   }
   ```

---

### 6. Sign Intent
**POST /sign_intent**

Signs a trade intent using EIP-712 (ERC-8004 compatible) and returns the signature.

- **Request JSON:**
   ```json
   {
      "action": "BUY",
      "amount": 0.01,
      "reasoning": "LLM output string"
   }
   ```
- **Response:** `{ "action": ..., "amount": ..., "reasoning": ..., "signature": "0x..." }`

---

### 7. Execute Trade
**POST /execute_trade**

Executes a trade using Kraken CLI and returns the result.

- **Request JSON:**
   ```json
   {
      "pair": "XBT/USD",
      "side": "buy",
      "amount": 0.01
   }
   ```
- **Response:** `{ "status": "success|error", "output": "..." }`

---

### 8. Log Trade
**POST /log_trade**

Logs a trade’s PnL and equity for performance tracking.

- **Request JSON:**
   ```json
   {
      "pnl": 0.01,
      "equity": 100.5,
      "timestamp": "2026-04-01T12:00:00Z"  // optional
   }
   ```
- **Response:** `{ "status": "logged" }`

---

### 9. Get Metrics
**GET /metrics**

Returns Sharpe ratio, drawdown, and total returns for dashboarding.

- **Response:** `{ "sharpe": float, "drawdown": float, "returns": float }`

---

For more details, see EXECUTION_PLAN.md.
