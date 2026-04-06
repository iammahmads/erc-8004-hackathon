# Agent Page Feature Testing Guide

## Quick Verification Checklist

### ✅ NFT Registration & Persistence

**Test Steps**:
1. Navigate to Agent Profile page
2. Click **"Register Agent NFT"** button
3. Wait for transaction completion
4. Check if **NFT ID, Mint Date, Contract Address** appear
5. Refresh the page
6. Verify NFT details still visible (localStorage confirmed ✓)

**Expected Results**:
- ✓ NFT Metadata Card shows all details
- ✓ Status badge shows "Minted ✓"
- ✓ Buttons change to "View Mint Transaction" & "Download Metadata"
- ✓ Data persists after page refresh

**localStorage Check**:
```javascript
// Open DevTools Console and run:
localStorage.getItem('agent_nft_0x0740DeB986e2C7B7D4b4F3Aa4C2875a411380485')
// Should return JSON with: nft_id, tx_hash, mint_date, etc.
```

---

### ✅ Trust Score Card Display

**Test Steps**:
1. Look at Trust Score Card (below NFT registration)
2. Check if it shows:
   - Reputation score with progress bar (0-100)
   - Compliance rate percentage
   - Trade volume number
   - NFT minting status

**Expected Results**:
- ✓ Progress bar fills from 0% to current reputation
- ✓ Green/emerald gradient color
- ✓ Shows "Minted ✓ Jan 15, 2024" format
- ✓ All metrics visible and readable

---

### ✅ NFT Metadata Card

**Test Steps**:
1. Scroll to "NFT Metadata Card" section
2. Verify all fields present:
   - Name
   - Type
   - Description
   - Transaction Hash (clickable)
   - Contract Address (clickable)
   - Token ID
   - Minted At

**Expected Results**:
- ✓ All fields display correctly
- ✓ Links are blue and clickable
- ✓ "View on Sepolia" opens explorer in new tab
- ✓ "Download Metadata" button visible

---

### ✅ Download Metadata Feature

**Test Steps**:
1. Click **"Download Metadata"** button
2. Check browser downloads folder
3. Open `agent_nft_XXX_metadata.json`
4. Verify content includes:
   - agent_address
   - nft_id
   - tx_hash
   - mint_date
   - reputation data
   - artifacts_count
   - exported_at timestamp

**Expected Results**:
```json
{
  "agent_address": "0x0740DeB986e2C7B7D4b4F3Aa4C2875a411380485",
  "nft_id": "001",
  "tx_hash": "0x...",
  "reputation": {
    "compliant_trades": 24,
    "total_trades": 25,
    "compliance_rate": 96
  }
}
```

---

### ✅ View on Sepolia

**Test Steps**:
1. Click **"View on Sepolia"** button
2. Sepolia block explorer should open (sepolia.etherscan.io)
3. Should show transaction or contract details

**Expected Results**:
- ✓ Sepolia explorer opens in new tab
- ✓ Shows transaction hash or contract page
- ✓ Can verify on-chain status

---

### ✅ Reputation Stats Section

**Test Steps**:
1. Look at "Reputation Stats" cards (top of page)
2. Verify three metric cards visible:
   - Compliant Trades (green icon: Shield)
   - Total Trades (blue icon: TrendingUp)
   - Compliance Rate (yellow icon: Trophy)

**Expected Results**:
- ✓ Icons render correctly
- ✓ Numbers update accurately
- ✓ Card styling consistent with theme
- ✓ Badges visible on cards

---

### ✅ Trade Artifacts Section

**Test Steps**:
1. Scroll to "Trade Artifacts" section
2. Check if artifact count badge shows total count
3. Verify each artifact displays:
   - Compliance status (green/red badge)
   - Trade action (BUY/SELL)
   - Amount
   - Block number
   - Transaction hash
   - Timestamp

**Expected Results**:
- ✓ All artifacts load correctly
- ✓ Status badges color-coded (green=compliant)
- ✓ Transaction hashes clickable
- ✓ Data formatted consistently
- ✓ Up to 10 artifacts displayed with scroll

---

## Data Flow Test

**Complete User Journey**:

```
1. Load Agent Profile
   ↓ (Check: Page responsive, loads without errors)
   
2. Register New NFT
   ↓ (Check: Transaction submitted, ID received)
   
3. View NFT Details
   ↓ (Check: All metadata cards present, links work)
   
4. Refresh Page
   ↓ (Check: NFT data still visible from localStorage)
   
5. Download Metadata
   ↓ (Check: JSON file valid, all fields present)
   
6. Check Reputation Score
   ↓ (Check: Progress bar reflects actual score 0-100)
   
7. View Trade Artifacts
   ↓ (Check: All trades listed with proper formatting)
   
8. Click Sepolia Link
   ↓ (Check: Block explorer loads, shows transaction)
```

**Success Criteria**: All steps complete without errors

---

## Browser Console Checks

**Run these in DevTools Console to verify**:

### Check localStorage saved NFT:
```javascript
const nftData = localStorage.getItem('agent_nft_0x0740DeB986e2C7B7D4b4F3Aa4C2875a411380485');
console.log("NFT Data:", JSON.parse(nftData));
```

### Verify NFT Interface structure:
```javascript
const nft = JSON.parse(nftData);
console.assert(nft.nft_id, "NFT ID missing");
console.assert(nft.tx_hash, "Tx hash missing");
console.assert(nft.mint_date, "Mint date missing");
console.assert(nft.contract_address, "Contract address missing");
console.log("✓ All required fields present");
```

### Check reputation metrics:
```javascript
// Reputation should update after each trade
// Check by monitoring PRISM API calls in Network tab
console.log("Network tab → Check for /reputation/{address} responses");
```

---

## Common Issues & Resolution

| Issue | Cause | Solution |
|-------|-------|----------|
| NFT data lost after refresh | localStorage not set | Check if registration completed, try again |
| Sepolia link broken | Wrong network | Verify you're on Sepolia testnet |
| Metadata download empty | No artifacts yet | Execute a trade first |
| Progress bar not showing | Reputation score 0 | Trade compliance will increase it |
| Artifacts not visible | Still loading | Wait 2-3 seconds, refresh |
| localStorage full | Browser limit reached | Clear cache, export data first |

---

## Performance Notes

**Expected Load Times**:
- Agent Profile page: < 1s
- NFT registration: 2-5s (transaction time)
- Metadata download: < 100ms
- Sepolia link open: < 500ms
- Artifacts load: 1-2s

**Optimization Tips**:
- localStorage caches result for faster loads
- PRISM API response is cached for 60s
- Artifacts load incrementally (10 at a time)

---

## Before Reporting Issues

- [ ] Cleared browser cache
- [ ] Checked localStorage has data
- [ ] Verified network connection
- [ ] On correct Sepolia network
- [ ] No console errors (check DevTools)
- [ ] Tried refreshing page

---

## Test Results Table

Create this table as you test each feature:

| Feature | Test Date | Status | Notes |
|---------|-----------|--------|-------|
| NFT Registration | TBD | ⏳ | - |
| localStorage Persistence | TBD | ⏳ | - |
| Trust Score Card | TBD | ⏳ | - |
| Metadata Card Display | TBD | ⏳ | - |
| Download Metadata | TBD | ⏳ | - |
| View on Sepolia | TBD | ⏳ | - |
| Reputation Stats | TBD | ⏳ | - |
| Trade Artifacts | TBD | ⏳ | - |
| Page Responsiveness | TBD | ⏳ | - |
| No Console Errors | TBD | ⏳ | - |

---

## Success Indicator

✅ **All of the following working**:
1. NFT mints and ID appears
2. Data persists after refresh
3. Trust score shows progress bar
4. Metadata card displays all info
5. Download creates valid JSON
6. Sepolia links work
7. Artifacts display properly
8. No TypeScript/console errors

**When complete**: Agent Profile is production-ready! 🚀
