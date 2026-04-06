# ERC-8004 Web3 API Reference

Quick reference for all available Web3 functions and hooks.

## 🎣 React Hooks (`lib/hooks-web3.ts`)

### useTradeExecution()
Execute a signed trade on-chain.

```typescript
const { executeTrade, loading, error, txHash, step, reset } = useTradeExecution();

// Execute trade
const result = await executeTrade({
  action: 'BUY' | 'SELL',
  amount: number,        // e.g., 0.5
  entryPrice: number,    // e.g., 42500
  exitPrice: number,     // e.g., 43000
  pair?: string          // e.g., 'BTC/USD' (optional)
});

// Result
{
  success: boolean,
  txHash?: string,
  error?: string,
  step?: number
}

// States
loading          // ✅ When signing/submitting
error            // ❌ Error message if failed
txHash           // ✅ Transaction hash when complete
step             // 0=ready, 1=signing, 2=submitting, 3=posting, 4=complete
reset()          // Reset state for new trade
```

**Usage in Component:**
```typescript
const { executeTrade, loading } = useTradeExecution();

const handleExecute = async () => {
  const result = await executeTrade({
    action: 'BUY',
    amount: 1,
    entryPrice: 40000,
    exitPrice: 42000
  });
  
  if (result.success) {
    console.log('✅ Trade successful:', result.txHash);
  }
};
```

---

### useAgentRegistration()
Register agent by minting NFT identity.

```typescript
const { registerAgent, loading, error, txHash } = useAgentRegistration();

// Register agent
const result = await registerAgent();

// Result
{
  success: boolean,
  txHash?: string,
  error?: string
}

// States
loading   // ✅ When registering
error     // ❌ Error message
txHash    // ✅ NFT mint transaction hash
```

**Usage in Component:**
```typescript
const { registerAgent, loading, txHash } = useAgentRegistration();

return (
  <>
    <button onClick={registerAgent} disabled={loading}>
      {loading ? 'Registering...' : 'Register Agent'}
    </button>
    {txHash && (
      <a href={`https://sepolia.etherscan.io/tx/${txHash}`}>
        View NFT →
      </a>
    )}
  </>
);
```

---

### useAgentReputation()
Fetch and track agent reputation score.

```typescript
const { reputation, loading, error, fetchReputation } = useAgentReputation();

// Fetch reputation for address
const score = await fetchReputation('0x1234...');

// Returns
number | null

// States
reputation  // ✅ Current score
loading     // ✅ When fetching
error       // ❌ Error message
```

**Usage in Component:**
```typescript
const { reputation, fetchReputation } = useAgentReputation();

useEffect(() => {
  fetchReputation('0x1234...');
}, []);

return (
  <div>
    <p>Reputation: {reputation || 'Loading...'}</p>
  </div>
);
```

---

### useWalletConnection()
Connect/disconnect wallet.

```typescript
const { connected, address, loading, error, connect, disconnect } = useWalletConnection();

// Connect wallet
const addr = await connect();  // Returns address or null

// Disconnect
disconnect();

// States
connected   // ✅ true if connected
address     // 0x1234... address string or null
loading     // ✅ When connecting
error       // ❌ Error message
```

**Usage in Component:**
```typescript
const { address, connect, disconnect } = useWalletConnection();

return (
  <>
    {address ? (
      <>
        <p>Connected: {address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </>
    ) : (
      <button onClick={connect}>Connect Wallet</button>
    )}
  </>
);
```

---

## 🔧 Utility Functions (`lib/web3.ts`)

### connectWallet()
Connect to user's MetaMask wallet.

```typescript
const address = await connectWallet();
// Returns: '0x1234...'
// Throws: Error if MetaMask not found or user rejects
```

---

### getProvider()
Get ethers.js BrowserProvider instance.

```typescript
const provider = await getProvider();
// Returns: ethers.BrowserProvider
// Throws: Error if MetaMask not installed
```

---

### getSigner()
Get ethers.js Signer of connected account.

```typescript
const signer = await getSigner();
// Returns: ethers.Signer
```

---

### signTradeIntent()
Sign trade intent with EIP-712.

```typescript
const {
  domain,
  types,
  message,
  signature,
  signerAddress
} = await signTradeIntent(
  action: 'BUY' | 'SELL',
  amount: number,
  entryPrice: number,
  exitPrice: number,
  pair?: string,
  timestamp?: number
);

// Returns object with:
// - domain: EIP-712 domain
// - types: Message type definition
// - message: The actual message
// - signature: User's cryptographic signature
// - signerAddress: 0x... address that signed
```

---

### postTradeArtifact()
Post trade artifact (proof) on Validation Registry.

```typescript
const receipt = await postTradeArtifact(
  txHash: string,        // Transaction hash
  action: string,        // 'BUY' or 'SELL'
  amount: string,        // String amount
  isCompliant: boolean,  // true/false
  reasoningHash: string  // 0x... hash
);

// Returns: Transaction receipt
```

---

### getAgentReputation()
Fetch agent reputation score from contract.

```typescript
const score = await getAgentReputation('0x1234...');
// Returns: number (reputation score)
```

---

### getAgentArtifacts()
Get all trade artifacts posted by agent.

```typescript
const artifacts = await getAgentArtifacts('0x1234...');
// Returns: Array of artifact objects
```

---

### isAgentRegistered()
Check if address is registered as agent.

```typescript
const registered = await isAgentRegistered('0x1234...');
// Returns: true | false
```

---

### getCurrentAddress()
Get currently connected wallet address.

```typescript
const address = await getCurrentAddress();
// Returns: '0x1234...' or null if not connected
```

---

### formatTxHash()
Format transaction hash for display.

```typescript
const formatted = formatTxHash('0x1234...abcd');
// Returns: '0x1234...abcd'  → '0x1234...cd'
```

---

### getSepoliaExplorerUrl()
Get Etherscan URL for transaction.

```typescript
const url = getSepoliaExplorerUrl('0x1234...');
// Returns: 'https://sepolia.etherscan.io/tx/0x1234...'
```

---

### getSepoliaAddressUrl()
Get Etherscan URL for address.

```typescript
const url = getSepoliaAddressUrl('0x1234...');
// Returns: 'https://sepolia.etherscan.io/address/0x1234...'
```

---

## 📱 Components

### WalletConnection
Wallet connection UI component.

```typescript
import { WalletConnection } from '@/components/WalletConnection';

export default function MyPage() {
  return <WalletConnection />;
}
```

**Features:**
- ✅ Connect button
- ✅ Shows connected address
- ✅ Etherscan link
- ✅ Copy address button
- ✅ Disconnect button

---

### TradeExecutionModal
Modal for signing and executing trades.

```typescript
import { TradeExecutionModal } from '@/components/TradeExecutionModal';
import { useState } from 'react';

export default function TradePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [trade, setTrade] = useState(null);

  return (
    <>
      <button onClick={() => {
        setTrade({
          action: 'BUY',
          amount: 0.5,
          entryPrice: 42500,
          exitPrice: 43000
        });
        setIsOpen(true);
      }}>
        Execute Trade
      </button>

      {trade && (
        <TradeExecutionModal
          trade={trade}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={(txHash) => console.log('Success:', txHash)}
        />
      )}
    </>
  );
}
```

**Props:**
```typescript
interface TradeExecutionModalProps {
  trade: {
    action: 'BUY' | 'SELL';
    amount: number;
    entryPrice: number;
    exitPrice: number;
    pair?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}
```

---

## 🔌 Backend API Endpoints

### POST /api/execute-trade
Submit signed trade to Risk Router.

**Request:**
```typescript
{
  tradeIntent: {
    agent: string;
    action: string;
    asset: string;
    amount: number;
    entryPrice: number;
    exitPrice: number;
    timestamp: number;
    nonce: number;
  },
  signature: string,
  action: string,
  amount: string,
  pair: string
}
```

**Response:**
```typescript
{
  status: 'success',
  tx_hash: string,
  action: string,
  amount: string,
  pair: string,
  timestamp: number,
  message: string
}
```

---

### POST /api/register-agent
Register agent (mint NFT).

**Request:**
```typescript
{
  agent_address?: string
}
```

**Response:**
```typescript
{
  status: 'success',
  tx_hash: string,
  agent_address: string,
  message: string
}
```

---

### POST /api/post-artifact
Post trade artifact on Validation Registry.

**Request:**
```typescript
{
  txHash: string,
  action: string,
  amount: string,
  compliant: boolean,
  reasoning: string
}
```

**Response:**
```typescript
{
  status: 'success',
  artifact_hash: string,
  tx_hash: string,
  action: string,
  compliant: boolean,
  message: string
}
```

---

### GET /api/reputation/{agent_address}
Get agent reputation score.

**Response:**
```typescript
{
  agent_address: string,
  reputation: number,
  status: 'good' | 'building'
}
```

---

### GET /api/artifacts/{agent_address}
Get all trade artifacts for agent.

**Response:**
```typescript
{
  agent_address: string,
  artifacts: Array<{
    txHash: string;
    action: string;
    amount: number;
    compliant: boolean;
    timestamp: number;
  }>,
  count: number
}
```

---

### GET /api/health/erc8004
Check ERC-8004 integration health.

**Response:**
```typescript
{
  status: 'healthy' | 'incomplete',
  network: 'Sepolia',
  checks: {
    provider: boolean,
    risk_router: boolean,
    agent_registry: boolean,
    private_key: boolean,
    abi_file: boolean
  }
}
```

---

## 🎯 Common Patterns

### Pattern 1: Connect Wallet
```typescript
import { useWalletConnection } from '@/lib/hooks-web3';

export function ConnectButton() {
  const { address, connect } = useWalletConnection();
  
  return (
    <button onClick={connect}>
      {address ? `Connected: ${address.slice(0, 6)}...` : 'Connect'}
    </button>
  );
}
```

---

### Pattern 2: Execute Trade
```typescript
import { useTradeExecution } from '@/lib/hooks-web3';

export function TradeForm() {
  const { executeTrade, loading, error } = useTradeExecution();
  
  const handleSubmit = async (formData) => {
    const result = await executeTrade(formData);
    if (result.success) {
      alert(`Success! Hash: ${result.txHash}`);
    } else {
      alert(`Error: ${result.error}`);
    }
  };
  
  return (
    <form onSubmit={e => {
      e.preventDefault();
      handleSubmit({
        action: 'BUY',
        amount: 0.5,
        entryPrice: 42500,
        exitPrice: 43000
      });
    }}>
      <button disabled={loading}>{loading ? 'Executing...' : 'Execute'}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

### Pattern 3: Track Reputation
```typescript
import { useAgentReputation } from '@/lib/hooks-web3';
import { useEffect } from 'react';

export function ReputationCard({ address }) {
  const { reputation, fetchReputation } = useAgentReputation();
  
  useEffect(() => {
    fetchReputation(address);
  }, [address]);
  
  return (
    <div>
      <h3>Agent Reputation</h3>
      <p className={reputation > 50 ? 'good' : 'warning'}>
        Score: {reputation}
      </p>
    </div>
  );
}
```

---

## 📋 Type Definitions

```typescript
// Trade intent
interface Trade {
  action: 'BUY' | 'SELL';
  amount: number;
  entryPrice: number;
  exitPrice: number;
  pair?: string;
}

// Reputation
type ReputationScore = number;

// Artifact
interface TradeArtifact {
  txHash: string;
  action: string;
  amount: number;
  compliant: boolean;
  timestamp: number;
}

// API responses
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 🚨 Error Handling

All functions throw on error. Always wrap in try-catch:

```typescript
try {
  const address = await connectWallet();
  console.log('Connected:', address);
} catch (error) {
  if (error instanceof Error) {
    console.error('Connection failed:', error.message);
  }
}
```

Common errors:
- `MetaMask not found` - Install MetaMask
- `User rejected request` - User clicked Cancel
- `Network mismatch` - Switch to Sepolia
- `Invalid signature` - Transaction already signed

---

## ⚡ Performance Tips

1. **Memoize hooks** - Avoid reconnecting on every render
```typescript
const wallet = useMemo(() => useWalletConnection(), []);
```

2. **Debounce calls** - Don't spam contract reads
```typescript
const debouncedFetch = useCallback(
  debounce((addr) => fetchReputation(addr), 1000),
  []
);
```

3. **Cache results** - Store in localStorage/React Query
```typescript
const reputation = localStorage.getItem(`rep_${address}`) || 
  await fetchReputation(address);
```

---

## 📚 Full Example

Complete page with all features:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { WalletConnection } from '@/components/WalletConnection';
import { TradeExecutionModal } from '@/components/TradeExecutionModal';
import { useTradeExecution, useAgentReputation } from '@/lib/hooks-web3';

export default function TradingPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  
  const { executeTrade, loading } = useTradeExecution();
  const { reputation, fetchReputation } = useAgentReputation();

  useEffect(() => {
    if (userAddress) {
      fetchReputation(userAddress);
    }
  }, [userAddress]);

  const handleExecute = (trade) => {
    setSelectedTrade(trade);
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Wallet Section */}
      <div className="border p-4 rounded">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
        <WalletConnection />
      </div>

      {/* Reputation Section */}
      {reputation !== null && (
        <div className="border p-4 rounded">
          <h2 className="text-2xl font-bold mb-2">Reputation</h2>
          <p className="text-lg font-bold">Score: {reputation}</p>
        </div>
      )}

      {/* Trade Form */}
      <div className="border p-4 rounded">
        <h2 className="text-2xl font-bold mb-4">Execute Trade</h2>
        <button 
          onClick={() => handleExecute({
            action: 'BUY',
            amount: 0.5,
            entryPrice: 42500,
            exitPrice: 43000
          })}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Buy 0.5 BTC
        </button>
      </div>

      {/* Modal */}
      {selectedTrade && (
        <TradeExecutionModal
          trade={selectedTrade}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```

---

That's everything! Start with the hooks and build from there. 🚀
