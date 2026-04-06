# Agent Profile Page - Enhanced Documentation

## Overview

The **Agent Profile page** is now a comprehensive dashboard for managing your on-chain agent identity through NFT minting and tracking all agent activities, reputation metrics, and trade artifacts.

---

## Key Features

### 1. NFT Registration & Minting

**Action**: Register your agent as an on-chain NFT (ERC-8004 standard)

**After Minting, You Get**:
- ✅ Unique NFT ID (`#XXXX`)
- ✅ Transaction hash (verifiable on-chain)
- ✅ Permanent mint date
- ✅ Contract address
- ✅ All metadata saved to localStorage

**Persistent Storage**: NFT details are saved to browser localStorage with key `agent_nft_{AGENT_ADDRESS}` so they persist across sessions.

**Use Case**: 
- Proves agent legitimacy on-chain
- Creates verifiable identity for regulatory compliance
- Enables on-chain reputation tracking
- Links all trades to specific agent NFT

---

### 2. Trust Score & Reputation Metrics

**Display**: Large card with visual progress bar and key metrics

**Metrics Tracked**:
- **Reputation Score** (0-100): Overall agent trust score
- **Compliance Rate** (%): Percentage of compliant trades
- **Compliant Trades** (count): Number of regulation-compliant trades
- **Total Trade Volume** (count): Total trades executed

**How It Works**:
- Automatically calculated based on on-chain artifacts
- Updated in real-time after each trade
- Displayed as visual progress bar for easy scanning
- Integrated with NFT details (shows when minted)

**Use Case**:
- Investors view this to assess agent reliability
- Regulators verify compliance automatically
- Dashboard shows trustworthiness at a glance

---

### 3. NFT Metadata Card

**Information Displayed**:
- Token Name: `Agent #{NFT_ID}`
- Token Type: Agent Identity NFT (ERC-8004)
- Description: "On-chain trading agent with compliance verification"
- Transaction Hash (linked to Sepolia Explorer)
- Contract Address (clickable to contract view)
- Token ID
- Mint Date & Time

**Why This Matters**:
- Complete on-chain identity record
- Verifiable on Sepolia testnet
- Historical proof of agent creation
- Links agent to specific contract deployment

**Actions Available**:
1. **View on Sepolia** - Opens NFT details on block explorer
2. **Download Metadata** - Exports complete NFT + reputation data as JSON

---

### 4. Agent Stats at a Glance

**Three Dashboard Cards**:

#### Compliant Trades (Green)
- Shows number of regulation-compliant trades
- Indicates agent follows rules

#### Total Trades (Blue)  
- Shows total trading volume
- Demonstrates activity level

#### Compliance Rate (Yellow)
- Percentage of trades that are compliant
- Higher % = more trustworthy

---

### 5. Trade Artifacts Section

**What Are Artifacts?**
- Off-chain proof of executed trades
- Each trade creates an artifact record
- Linked to agent NFT for accountability

**Artifact Details Shown**:
- Compliance status (Compliant/Non-Compliant badge)
- Trade action (BUY/SELL)
- Trade amount (in BTC)
- Block number (on-chain reference)
- Transaction hash (verifiable)
- Timestamp

**Why Important**:
- Proves all trades are recorded
- Verifiable audit trail
- Can be used for regulatory compliance
- Linked to on-chain contract

---

### 6. Persistence & Local Storage

**What Gets Saved**:
```json
{
  "nft_id": "001",
  "tx_hash": "0x...",
  "mint_date": "2024-01-15T10:30:00Z",
  "contract_address": "0x...",
  "metadata": {
    "name": "Agent #001",
    "description": "On-chain trading agent with compliance verification"
  }
}
```

**Saved To**: `localStorage.agentNFT_{AGENT_ADDRESS}`

**Benefits**:
- NFT details persist after page refresh
- No need to re-fetch from blockchain constantly
- Offline availability of key info
- Faster page loads

**How to Access**:
- Open browser DevTools → Application → Local Storage
- Look for key: `agent_nft_0x0740DeB986e2C7B7D4b4F3Aa4C2875a411380485`

---

## Use Cases After NFT Minting

### 1. **Regulatory Compliance**
- Provide NFT ID as proof of agent identity
- Show compliance rate to regulators
- Export metadata as compliance report

### 2. **Investor Verification**
- Investors check Agent Profile before trusting
- View reputation score and compliance rate
- See complete trade history with artifacts

### 3. **Agent Marketing**
- Share NFT ID on website/marketing materials
- Link to Sepolia explorer as proof
- Demonstrate compliance credentials

### 4. **Audit Trail**
- Download complete metadata export
- Contains all agent stats + reputation
- Time-stamped for historical records

### 5. **Post-Trade Verification**
- Every trade creates an artifact
- Linked to agent NFT
- Proves all trades are traceable

---

## Data Flow After Minting

```
1. User clicks "Register Agent NFT"
   ↓
2. Backend generates NFT, returns ID + tx_hash
   ↓
3. Frontend saves to localStorage
   ↓
4. NFT Metadata Card displays saved data
   ↓
5. User can download export or view on-chain
   ↓
6. Trust score updates as trades execute
   ↓
7. All artifacts linked to this NFT
```

---

## Download Metadata Feature

**What You Get**:
```json
{
  "agent_address": "0x...",
  "nft_id": "001",
  "tx_hash": "0x...",
  "mint_date": "2024-01-15T10:30:00Z",
  "contract_address": "0x...",
  "reputation": {
    "compliant_trades": 24,
    "total_trades": 25,
    "compliance_rate": 96,
    "reputation_score": 92
  },
  "artifacts_count": 25,
  "exported_at": "2024-01-15T14:20:00Z"
}
```

**File Name**: `agent_nft_{NFT_ID}_metadata.json`

**Use Cases**:
- Backup important data
- Share with auditors
- Import into other systems
- Archive for records

---

## Page Layout

```
┌─────────────────────────────────────────┐
│ Agent Profile Header                    │
│ [Refresh Button]                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ NFT Identity Card                       │
│ ├─ Agent Address (with copy)            │
│ ├─ NFT ID / Mint Date / Contract        │
│ ├─ Status Badge (Minted ✓)              │
│ ├─ [Register NFT] / [View Tx]           │
│ └─ [Download Metadata]                  │
└─────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Compliant    │ Total        │ Compliance   │
│ Trades: 24   │ Trades: 25   │ Rate: 96%    │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────┐
│ Trust Score Card                        │
│ ├─ [████████░░] 92/100                  │
│ ├─ Compliant Rate: 96% / Volume: 25     │
│ ├─ NFT Status: #001 (Minted)            │
│ └─ Minted: Jan 15, 2024                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ NFT Metadata Card                       │
│ ├─ Name: Agent #001                     │
│ ├─ Type: Agent Identity NFT (ERC-8004)  │
│ ├─ Description: On-chain agent...       │
│ ├─ TX Hash: [linked to explorer]        │
│ ├─ Contract: [linked to explorer]       │
│ ├─ Token ID: #001                       │
│ ├─ Minted At: Jan 15, 2024              │
│ ├─ [Download Metadata]                  │
│ └─ [View on Sepolia]                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Trade Artifacts                         │
│ (25 Artifacts)                          │
│ ├─ [Artifact 1] Compliant ✓             │
│ ├─ [Artifact 2] Compliant ✓             │
│ ├─ [Artifact 3] Compliant ✓             │
│ └─ ... (up to 10 displayed)             │
└─────────────────────────────────────────┘
```

---

## Key Benefits Summary

| Feature | Benefit |
|---------|---------|
| **NFT Registration** | Permanent on-chain identity verified |
| **Reputation Tracking** | Investors can verify trust score |
| **Compliance Rate** | Regulators see compliance automatically |
| **Metadata Export** | Audit trail for compliance/legal |
| **Artifacts Link** | Every trade is traceable to agent |
| **LocalStorage Save** | Data persists, faster page loads |
| **Explorer Links** | Everything verifiable on-chain |

---

## Next Steps / Future Enhancements

1. **Reputation History** - Graph of trust score over time
2. **NFT Upgrades** - Level up NFT based on performance
3. **Badge System** - Earn badges for achievements
4. **Custom Metadata** - User-customizable NFT properties
5. **Staking** - Stake tokens to increase reputation
6. **DAO Membership** - NFT grants governance rights
7. **Marketplace** - Sell/trade agent NFTs
8. **Rental Model** - Allow others to use your agent

---

## Technical Details

**Saved Data Location**: 
- Key: `agent_nft_{AGENT_ADDRESS}`
- Storage: Browser LocalStorage
- Persistence: Until localStorage cleared

**On-Chain Contract**: 
- Type: ERC-8004 (Macro-Sentry Agent NFT)
- Network: Sepolia Testnet
- Standard: Extends ERC-721

**API Endpoints Used**:
- `POST /register_agent` - Mint NFT
- `GET /reputation/{address}` - Get trust score
- `GET /artifacts/{address}` - Get trade artifacts

---

## Support Information

**For Issues**:
1. Check LocalStorage has saved data
2. Verify Sepolia connection
3. Check transaction on explorer
4. Refresh page to sync data
5. Try downloading metadata

**Data Recovery**:
- If data lost, re-register NFT (new ID)
- Export metadata before major browser updates
- Keep downloaded JSON files as backup
