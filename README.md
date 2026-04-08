# Macro-Sentry (ERC-8004 + Kraken CLI)

Macro-Sentry is an AI trading agent with a dashboard UI, designed to satisfy **both tracks** of the lablab.ai **AI Trading Agents** hackathon:

- **Kraken Challenge**: execute trades via **Kraken CLI** (with a safe paper-trading fallback).
- **ERC-8004 Challenge**: register agent identity, sign intents (EIP-712), and post on-chain **validation artifacts** + read reputation/artifacts.

Hackathon details: [AI Trading Agents | lablab.ai](https://lablab.ai/ai-hackathons/ai-trading-agents)  
Submission checklist: [Submission Guidelines | lablab.ai](https://lablab.ai/delivering-your-hackathon-solution)

## Repo structure

- `backend/`: FastAPI backend (signals, decisioning, execution, ERC-8004 endpoints)
- `frontend/`: Next.js dashboard UI

## Local quickstart (paper mode, safe defaults)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Optional: copy env template
cp .env.example .env

uvicorn main:app --reload --port 8000
```

Backend health endpoint: `GET /status`

### Frontend

```bash
cd frontend
npm install

# Optional: copy env template
cp .env.example .env.local

npm run dev
```

Open `http://localhost:3000`.

## Demo flow (judge-friendly)

1. **Dashboard**: run **Auto-Trade Now** to execute the full pipeline.
2. **Trade Details**: view LLM decision + sign intent + execute (paper/live depending on setup).
3. **Agent Profile**: register identity NFT + review reputation/artifacts.
4. **Portfolio**: review logged trades and performance summary.

## Execution modes

The backend is safe-by-default and supports:

- **Paper execution**: if `kraken-cli` is not installed, execution falls back to paper mode automatically.
- **On-chain artifacts** (optional): set `ONCHAIN_MODE=on` and configure contract env vars to post artifacts during `/auto-trade`.

See `backend/.env.example` and `frontend/.env.example` for required variables.

## Security notes

- Never commit real keys. Use `.env` files locally and keep them out of git.
- Start in **paper mode** first, then enable live/on-chain only when configured and funded appropriately.

