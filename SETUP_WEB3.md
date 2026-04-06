# Quick Setup Guide: ERC-8004 Web3 Integration

This guide gets your frontend connected to the ERC-8004 contract in **15 minutes**.

## ✅ What You'll Get

After setup:
- ✅ Wallet connection (MetaMask)
- ✅ EIP-712 trade signing
- ✅ On-chain trade execution
- ✅ Artifact posting to Validation Registry
- ✅ Reputation tracking

## 🚀 Step-by-Step Setup

### 1. Install Web3 Dependencies

```bash
cd /home/ahmad/Projects/erc-8004/frontend

npm install ethers@6.11.1
```

That's it! `ethers` is all you need for Web3 integration.

### 2. Set Up Environment Variables

Create `.env.local` in the frontend directory:

```bash
cat > /home/ahmad/Projects/erc-8004/frontend/.env.local << 'EOF'
# Sepolia RPC - Public free endpoint
NEXT_PUBLIC_SEPOLIA_RPC=https://sepolia.drpc.org

# Contract Addresses - Get these from hackathon resources
NEXT_PUBLIC_RISK_ROUTER=0x00000000000000000000000000000000000000AA
NEXT_PUBLIC_AGENT_REGISTRY=0x00000000000000000000000000000000000000BB
NEXT_PUBLIC_NFT_CONTRACT=0x00000000000000000000000000000000000000CC

# Backend API (change to your backend URL)
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

### 3. Wire Components Into Your Pages

#### In `frontend/app/trade/page.tsx`:

```typescript
'use client';

import { TradeExecutionModal } from '@/components/TradeExecutionModal';
import { WalletConnection } from '@/components/WalletConnection';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function TradePage() {
  const [showExecution, setShowExecution] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const handleExecuteTrade = (trade: any) => {
    setSelectedTrade(trade);
    setShowExecution(true);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection - Add at top */}
      <WalletConnection />

      {/* Your existing trade form/UI */}
      {/* ... */}

      {/* Trade execution button */}
      <Button 
        onClick={() => handleExecuteTrade({
          action: 'BUY',
          amount: 0.5,
          entryPrice: 42500,
          exitPrice: 43000,
          pair: 'BTC/USD'
        })}
        className="w-full"
      >
        Execute Trade On-Chain
      </Button>

      {/* Modal for confirmations */}
      {selectedTrade && (
        <TradeExecutionModal
          trade={selectedTrade}
          isOpen={showExecution}
          onClose={() => setShowExecution(false)}
          onSuccess={(txHash) => {
            console.log('Trade successful:', txHash);
            setShowExecution(false);
          }}
        />
      )}
    </div>
  );
}
```

#### In `frontend/app/agent/page.tsx`:

```typescript
'use client';

import { WalletConnection } from '@/components/WalletConnection';
import { useAgentRegistration } from '@/lib/hooks-web3';
import { Button } from '@/components/ui/button';

export default function AgentPage() {
  const { registerAgent, loading, txHash } = useAgentRegistration();

  return (
    <div className="space-y-6">
      {/* Wallet connection */}
      <WalletConnection />

      {/* Registry section */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Agent Identity</h2>
        
        {txHash ? (
          <div className="bg-green-500/20 p-4 rounded border border-green-500">
            <p className="text-green-100">✅ Agent registered!</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener"
              className="text-blue-400 hover:text-blue-300"
            >
              View on Etherscan →
            </a>
          </div>
        ) : (
          <Button 
            onClick={() => registerAgent()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Registering...' : 'Register as Agent'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 4. Wire Backend API Router

In `backend/main.py`, add the new endpoints:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.contract_api import router as contract_router
from core.erc8004_api import router as erc8004_router  # NEW

app = FastAPI(title="MacroSentry Agent")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(contract_router)
app.include_router(erc8004_router)  # NEW

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### 5. Update Backend Environment

in `.env` (backend):

```
PROVIDER_URL=https://sepolia.drpc.org
RISK_ROUTER_ADDRESS=0x00000000000000000000000000000000000000AA
AGENT_REGISTRY_ADDRESS=0x00000000000000000000000000000000000000BB
AGENT_PRIVATE_KEY=0x... # Your agent's private key (starts with 0x)
CONTRACT_ABI_PATH=core/MacroSentryAgent.abi.json
```

### 6. Build & Test

```bash
# Backend
cd /home/ahmad/Projects/erc-8004/backend
python -m pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd /home/ahmad/Projects/erc-8004/frontend
npm run dev
```

Then test:
1. Go to http://localhost:3000/trade
2. Click "Connect Wallet"
3. Approve MetaMask connection to Sepolia
4. Click "Execute Trade On-Chain"
5. Sign the transaction in MetaMask
6. Watch it appear on Sepolia Etherscan!

---

## 📝 What Each File Does

| File | Purpose | Status |
|------|---------|--------|
| `frontend/lib/web3.ts` | Low-level ethers.js calls | ✅ Created |
| `frontend/lib/hooks-web3.ts` | React hooks for Web3 | ✅ Created |
| `frontend/components/TradeExecutionModal.tsx` | UI for signing trades | ✅ Created |
| `frontend/components/WalletConnection.tsx` | Wallet connect UI | ✅ Created |
| `backend/core/erc8004_api.py` | Trade/artifact endpoints | ✅ Created |

---

## 🔍 Understanding the Flow

```
1. User clicks "Execute Trade"
   ↓
2. [FRONTEND] open TradeExecutionModal
   ↓
3. User clicks "Sign & Execute"
   ↓
4. [FRONTEND] Call signTradeIntent() → Creates EIP-712 message
   ↓
5. [USER] Approves in MetaMask
   ↓
6. [FRONTEND] Get signed message + signature
   ↓
7. [FRONTEND] POST to /api/execute-trade with signature
   ↓
8. [BACKEND] Validate signature
   ↓
9. [BACKEND] Submit to Risk Router contract
   ↓
10. [CONTRACT] Execute trade, emit event
    ↓
11. [BACKEND] Post artifact on Validation Registry
    ↓
12. [FRONTEND] Show success with tx hash
    ↓
13. [VALIDATORS] See artifact, score compliance
    ↓
14. [REPUTATION] Agent score increases
```

---

## 🎯 Key Concepts

### EIP-712 Signing
- User signs trade intent **without** sending transaction
- Proves user authorized this trade
- Backend verifies signature
- Much cheaper than normal transactions

### Risk Router
- Validates position limits
- Checks daily loss limits  
- Enforces leverage limits
- Records trades on-chain

### Validation Registry
- Stores proof of every trade
- Validators score compliance
- Feeds reputation system
- Public on blockchain

### Reputation
- Starts at 0
- Increases with compliant trades
- Public/trustless (on-chain)
- Determines agent trustworthiness

---

## ❓ Troubleshooting

### "MetaMask not found"
- Install MetaMask extension: https://metamask.io

### "Network mismatch"
- Click MetaMask, switch to "Sepolia" network

### "No transaction hash returned"
- Backend might not be running
- Check: `curl http://localhost:8000/health`

### "Signature verification failed"
- Make sure you approved the MetaMask signature request
- Check browser console for details

### "Contract call failed"
- Verify contract addresses in `.env.local`
- Check you have Sepolia ETH (faucet: https://sepoliafaucet.com)

---

## ✅ Checklist

Before submitting to hackathon:

- [ ] `npm install ethers` completed
- [ ] `.env.local` configured with real contract addresses
- [ ] Backend `.env` has `AGENT_PRIVATE_KEY`
- [ ] `WalletConnection` component on `/trade` page
- [ ] `TradeExecutionModal` opens on trade button click
- [ ] Buy/Sell trade executes with MetaMask signing
- [ ] Transaction appears on Sepolia Etherscan
- [ ] Backend `/api/health/erc8004` returns all checks passing
- [ ] Wallet address visible in UI
- [ ] Transaction hash links to Etherscan

---

## 🚀 Next Steps

1. **Get Contract Addresses**
   - Ask hackathon organizers for:
     - Risk Router contract address
     - Agent Registry address
     - NFT contract address
   - Or find in: https://github.com/sudeepb02/awesome-erc8004

2. **Fund Your Agent**
   - Send Sepolia ETH to your agent address
   - Faucet: https://sepoliafaucet.com
   - Cost per trade: ~$0.01 USD

3. **Deploy to Testnet**
   - Backend: EC2/Railway/Replit
   - Frontend: Vercel/Netlify
   - Update CORS in main.py

4. **Monitor On-Chain**
   - Reputation: `GET /reputation/{address}`
   - Artifacts: `GET /artifacts/{address}`
   - Validator scores

---

Need help? Check out:
- https://docs.ethers.org/v6/
- https://eips.ethereum.org/EIPS/eip-712
- https://eips.ethereum.org/EIPS/eip-8004
- https://lablab.ai/ai-hackathons/ai-trading-agents
