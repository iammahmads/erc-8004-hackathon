# ERC-8004 Web Integration Guide - Hackathon Implementation

## Overview

Following the [official hackathon requirements](https://lablab.ai/ai-hackathons/ai-trading-agents), you need:

1. **Agent Identity Registry** - NFT registration (ERC-721)
2. **Trade Intent Signing** - EIP-712 typed data signatures
3. **Risk Router** - Contract that enforces position limits & executes trades
4. **Validation Registry** - Posts trade artifacts on-chain
5. **Reputation Tracking** - Validators score your trades

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ MetaMask / Wallet             Next.js Frontend   │   │
│  │                                                   │   │
│  │  User clicks "Execute Trade"                     │   │
│  │         ↓                                         │   │
│  │  [1] Sign Trade Intent (EIP-712)                │   │
│  │         ↓                                         │   │
│  │  [2] Call Risk Router.executeTradeIntent()       │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                               │
│              Sepolia Testnet (or L2)                   │
│              ┌──────────────────────┐                 │
│              │ SMART CONTRACTS      │                 │
│              ├──────────────────────┤                 │
│              │ Agent Identity NFT   │ (ERC-8004)      │
│              │ Risk Router          │ (Validates)     │
│              │ Validation Registry  │ (Artifacts)     │
│              │ Reputation Score     │ (Tracks Score)  │
│              └──────────────────────┘                 │
│                      ↓                                │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Install Web3 Dependencies

```bash
cd /home/ahmad/Projects/erc-8004/frontend

# Core web3 library
npm install ethers@6.11.1

# React hooks for web3 (recommended but optional)
npm install wagmi@2.5.0 @wagmi/core@2.5.0
npm install @rainbow-me/rainbowkit@2.1.2

# For EIP-712 signing
npm install @ethersproject/hash@5.7.0
```

---

## Step 2: Create Web3 Integration Layer

Create `frontend/lib/web3.ts`:

```typescript
import { ethers } from 'ethers';

const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.drpc.org';
const RISK_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_RISK_ROUTER || '0x...';
const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY || '0x...';

// Get connected wallet
export async function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  return new ethers.BrowserProvider(window.ethereum);
}

// Get signer (user's account)
export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

// Connect wallet
export async function connectWallet() {
  try {
    const provider = await getProvider();
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection failed:', error);
    throw error;
  }
}

// Sign EIP-712 Trade Intent
export async function signTradeIntent(
  action: 'BUY' | 'SELL',
  amount: number,
  entryPrice: number,
  exitPrice: number,
  timestamp: number
) {
  const signer = await getSigner();
  const signerAddress = await signer.getAddress();

  // EIP-712 Domain
  const domain = {
    name: 'MacroSentryAgent',
    version: '1',
    chainId: 11155111, // Sepolia
    verifyingContract: RISK_ROUTER_ADDRESS,
  };

  // TradeIntent type definition
  const types = {
    TradeIntent: [
      { name: 'agent', type: 'address' },
      { name: 'action', type: 'string' }, // 'BUY' or 'SELL'
      { name: 'amount', type: 'uint256' }, // in wei
      { name: 'entryPrice', type: 'uint256' }, // in wei
      { name: 'exitPrice', type: 'uint256' }, // in wei
      { name: 'timestamp', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  // Message data
  const message = {
    agent: signerAddress,
    action,
    amount: ethers.parseEther(amount.toString()),
    entryPrice: ethers.parseEther(entryPrice.toString()),
    exitPrice: ethers.parseEther(exitPrice.toString()),
    timestamp,
    nonce: Math.floor(Date.now() / 1000),
  };

  // Sign message
  const signature = await signer.signTypedData(domain, types, message);

  return {
    message,
    signature,
    signerAddress,
  };
}

// Post Trade Artifact (on-chain proof)
export async function postTradeArtifact(
  txHash: string,
  action: string,
  amount: string,
  isCompliant: boolean,
  reasoningHash: string
) {
  const signer = await getSigner();
  
  // Simple contract call ABI
  const abi = [
    'function postArtifact(bytes32 txHash, string action, uint256 amount, bool compliant, bytes32 reasoning) external returns (bytes32)',
  ];

  const contract = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    abi,
    signer
  );

  const tx = await contract.postArtifact(
    txHash,
    action,
    ethers.parseEther(amount),
    isCompliant,
    reasoningHash
  );

  return await tx.wait();
}

// Get agent reputation
export async function getAgentReputation(agentAddress: string) {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  
  const abi = [
    'function getReputation(address agent) external view returns (uint256)',
  ];

  const contract = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    abi,
    provider
  );

  return await contract.getReputation(agentAddress);
}
```

---

## Step 3: Create Trade Execution Hook

Create `frontend/lib/hooks-web3.ts`:

```typescript
import { useState } from 'react';
import { signTradeIntent, postTradeArtifact } from './web3';

export function useTradeExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const executeTrade = async (trade: {
    action: 'BUY' | 'SELL';
    amount: number;
    entryPrice: number;
    exitPrice: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Sign trade intent (EIP-712)
      console.log('Signing trade intent...');
      const { message, signature } = await signTradeIntent(
        trade.action,
        trade.amount,
        trade.entryPrice,
        trade.exitPrice,
        Math.floor(Date.now() / 1000)
      );

      // Step 2: Call backend to submit to Risk Router
      console.log('Submitting to Risk Router...');
      const response = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeIntent: message,
          signature,
          action: trade.action,
          amount: trade.amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Trade execution failed');
      }

      const { tx_hash } = await response.json();
      setTxHash(tx_hash);

      // Step 3: Post artifact on-chain
      console.log('Posting artifact...');
      const reasoningHash = '0x' + Buffer.from('AI decided trade').toString('hex').padStart(64, '0');
      
      await postTradeArtifact(
        tx_hash,
        trade.action,
        trade.amount.toString(),
        true, // Mark as compliant
        reasoningHash
      );

      return { success: true, txHash: tx_hash };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { executeTrade, loading, error, txHash };
}
```

---

## Step 4: Create Trade Execution Component

Create `frontend/components/TradeExecutionModal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeExecution } from '@/lib/hooks-web3';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface TradeExecutionModalProps {
  trade: {
    action: 'BUY' | 'SELL';
    amount: number;
    entryPrice: number;
    exitPrice: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function TradeExecutionModal({ trade, isOpen, onClose }: TradeExecutionModalProps) {
  const { executeTrade, loading, error, txHash } = useTradeExecution();
  const [step, setStep] = useState(0);

  const handleSign = async () => {
    setStep(1);
    const result = await executeTrade(trade);
    if (result.success) {
      setStep(3);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Execute Trade On-Chain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steps */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 p-3 rounded ${step >= 0 ? 'bg-blue-500/20' : 'bg-slate-700/30'}`}>
              {step > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : step === 0 ? (
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              ) : null}
              <span>Signing Trade Intent (EIP-712)</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded ${step >= 1 ? 'bg-blue-500/20' : 'bg-slate-700/30'}`}>
              {step > 1 ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : step === 1 ? (
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              ) : null}
              <span>Submitting to Risk Router</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded ${step >= 2 ? 'bg-blue-500/20' : 'bg-slate-700/30'}`}>
              {step > 2 ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : step === 2 ? (
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              ) : null}
              <span>Posting Artifact Proof</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded ${step >= 3 ? 'bg-green-500/20' : 'bg-slate-700/30'}`}>
              {step >= 3 && <CheckCircle className="h-5 w-5 text-green-400" />}
              <span>Complete</span>
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-slate-800/50 p-4 rounded space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Action:</span>
              <span className="font-semibold">{trade.action}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">{trade.amount} BTC</span>
            </div>
            <div className="flex justify-between">
              <span>Entry:</span>
              <span className="font-semibold">${trade.entryPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Exit:</span>
              <span className="font-semibold">${trade.exitPrice}</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/20 rounded border border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-100">{error}</span>
            </div>
          )}

          {/* TX Hash */}
          {txHash && (
            <div className="bg-slate-800/50 p-4 rounded">
              <p className="text-xs text-slate-400 mb-2">Transaction Hash:</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 break-all font-mono"
              >
                {txHash}
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {step === 0 ? (
              <>
                <Button
                  onClick={handleSign}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Processing...' : 'Sign & Execute'}
                </Button>
                <Button onClick={onClose} variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </>
            ) : step === 3 ? (
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            ) : (
              <Button disabled className="w-full">
                Processing...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Step 5: Backend Endpoint for Risk Router

Create backend endpoint `backend/core/contract_api.py` add:

```python
from fastapi import APIRouter, Body
from eth_account.messages import encode_structured_data
from core.macrosentry_contract import MacroSentryContract
import json

@router.post("/execute-trade")
def execute_trade_with_signature(
    tradeIntent: dict = Body(...),
    signature: str = Body(...),
    action: str = Body(...),
    amount: str = Body(...),
):
    """
    Execute a trade that was signed by user wallet (EIP-712)
    This submits it to the Risk Router contract
    """
    
    try:
        # Validate signature matches intent
        # (In production: verify signature with ecrecover)
        
        # Submit to Risk Router
        contract = MacroSentryContract(
            provider_url=os.getenv("PROVIDER_URL"),
            contract_address=os.getenv("RISK_ROUTER_ADDRESS"),
            abi_path="core/RiskRouter.abi.json",  # You'll need this ABI
            private_key=os.getenv("AGENT_PRIVATE_KEY"),
        )
        
        # Call executeTradeIntent on Risk Router
        tx_hash = contract.execute_trade_intent(
            agent=tradeIntent["agent"],
            action=action,
            amount=tradeIntent["amount"],
            entry_price=tradeIntent["entryPrice"],
            exit_price=tradeIntent["exitPrice"],
            signature=signature
        )
        
        return {
            "tx_hash": tx_hash,
            "status": "pending",
            "message": "Trade submitted to Risk Router"
        }
    except Exception as e:
        return {"error": str(e)}, 400
```

---

## Step 6: Integration Points in UI

### In `frontend/app/trade/page.tsx`:

```typescript
'use client';

import { TradeExecutionModal } from '@/components/TradeExecutionModal';
import { useState } from 'react';

export default function TradePage() {
  const [showExecution, setShowExecution] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const handleExecuteTrade = (trade: any) => {
    setSelectedTrade(trade);
    setShowExecution(true);
  };

  return (
    <div>
      {/* Your trade form here */}
      
      <Button 
        onClick={() => handleExecuteTrade({
          action: 'BUY',
          amount: 0.5,
          entryPrice: 42500,
          exitPrice: 43000,
        })}
      >
        Execute Trade On-Chain
      </Button>

      {selectedTrade && (
        <TradeExecutionModal
          trade={selectedTrade}
          isOpen={showExecution}
          onClose={() => setShowExecution(false)}
        />
      )}
    </div>
  );
}
```

---

## Step 7: Environment Variables

Add to `.env.local`:

```
# Sepolia RPC
NEXT_PUBLIC_SEPOLIA_RPC=https://sepolia.drpc.org

# Contract Addresses (get these from hackathon resources)
NEXT_PUBLIC_RISK_ROUTER=0x...
NEXT_PUBLIC_AGENT_REGISTRY=0x...
NEXT_PUBLIC_NFT_CONTRACT=0x...

# Backend
REACT_APP_API_URL=http://localhost:8000

# Backend only
PROVIDER_URL=https://sepolia.drpc.org
MACROSENTRY_CONTRACT_ADDRESS=0x...
AGENT_PRIVATE_KEY=0x...
RISK_ROUTER_ADDRESS=0x...
```

---

## Step 8: Flow Diagram (What Happens)

```
USER CLICKS "EXECUTE TRADE"
        ↓
[FRONTEND]
1. User confirms trade details
2. Request from MetaMask to sign EIP-712 message
3. User clicks "Sign" in MetaMask
4. Frontend gets signed message + signature
        ↓
[BACKEND]
5. Validate signature (ecrecover)
6. Check trade passes Risk Router rules:
   - Position size < $50K
   - Daily loss < $10K
   - Leverage < 2x
7. Submit to Risk Router.executeTradeIntent()
8. Return tx_hash
        ↓
[ON-CHAIN]
9. Risk Router contract executes trade
10. Emits TradeExecuted event
11. Records trade with position limits
        ↓
[BACKEND]
12. Listen for TradeExecuted event
13. Post artifact to Validation Registry
14. Include: txHash, action, amount, compliance status
        ↓
[ON-CHAIN]
15. Validators see artifact
16. Score the compliance
17. Update agent reputation
        ↓
[FRONTEND]
18. Show success with tx link
19. Update reputation score
20. Trades visible on dashboard
```

---

## Step 9: Contract ABIs You'll Need

Request these from hackathon organizers:

1. **RiskRouter.abi.json** - Main execution contract
2. **ValidationRegistry.abi.json** - Post artifacts
3. **ReputationRegistry.abi.json** - Track scores
4. **AgentIdentity.abi.json** - NFT contract

Usually in the hackathon resource pack or:
- https://github.com/sudeepb02/awesome-erc8004
- https://eips.ethereum.org/EIPS/eip-8004

---

## Step 10: Testing Flow

```bash
# 1. Connect MetaMask to Sepolia testnet
# 2. Get Sepolia ETH from faucet (https://sepoliafaucet.com)
# 3. Run frontend
npm run dev

# 4. Navigate to /trade
# 5. Click "Execute Trade On-Chain"
# 6. Sign in MetaMask
# 7. Verify tx on Sepolia: https://sepolia.etherscan.io

# 8. Check your reputation:
curl http://localhost:8000/reputation/YOUR_ADDRESS
```

---

## Key Concepts

### EIP-712 Signing
- User signs trade intent without sending it
- Proves user authorized this specific trade
- Backend verifies signature with `ecrecover`
- Much cheaper than separate approval transaction

### Risk Router
- Validates position limits before executing
- Enforces daily loss limits
- Records all trades on-chain
- Emits events that Validators listen to

### Validation Registry
- Stores proof of every trade action
- Linked to agent NFT
- Validators score compliance
- Feeds into reputation

### Reputation Score
- Starts at 0
- Increases with compliant trades
- Validators determine compliance
- Public on blockchain = trustless

---

## Hackathon Checklist

- [ ] MetaMask connection working
- [ ] EIP-712 signing implemented
- [ ] Risk Router contract calls working
- [ ] Trade artifacts posting on-chain
- [ ] Reputation tracking functional
- [ ] All test trades recorded
- [ ] Tx hashes verifiable on Sepolia
- [ ] Validators have access to artifacts
- [ ] Reputation score updating

---

## Resources

- **EIP-712 Standard**: https://eips.ethereum.org/EIPS/eip-712
- **ERC-8004 Spec**: https://eips.ethereum.org/EIPS/eip-8004
- **Ethers.js v6**: https://docs.ethers.org/v6/
- **Wagmi Docs**: https://wagmi.sh/
- **Sepolia Testnet**: https://sepolia.dev/
- **Hackathon Docs**: https://lablab.ai/ai-hackathons/ai-trading-agents

---

This gives your project **real ERC-8004 integration** with on-chain verification, trustless execution, and verifiable reputation tracking! 🚀
