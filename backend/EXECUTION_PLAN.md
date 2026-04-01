# Macro-Sentry Agent: Phase-by-Phase Execution Plan

## 🏁 Phase-by-Phase Execution Plan

### Phase 1: Infrastructure & "Legal" Setup
**Goal:** Secure eligibility, set up APIs, and ensure the environment is ready.

**Tasks:**
- Register project at early.surge.xyz (prize eligibility).
- Sign up for PRISM API (grab credits, verify access).
- Generate Kraken API keys (Read-Only for leaderboard, Execution for agent).
- Set up ERC-8004 testnet wallet and registry access.
- Confirm Python environment, dependencies, and repo structure.
- Write a README with setup instructions.

**Checkpoints:**
- All API keys and credentials stored securely.
- Testnet wallet funded and connected.
- All team members can run the project locally.

---

### Phase 2: Intelligence Engine (Brain)
**Goal:** Build the core logic that processes macro signals into trade decisions.

**Tasks:**
- Integrate PRISM API: poll `/risk/{symbol}` and `/signals/{symbol}`.
- Implement macro-correlation logic (e.g., DXY volatility, S&P 500 stability).
- Define risk guardrail rules (e.g., reduce position size on high volatility).
- Build LLM decision module: aggregate data, output trade intent + reasoning.
- Unit test: Simulate PRISM responses, verify correct trade intent output.

**Checkpoints:**
- Mocked PRISM data produces expected trade decisions.
- All risk rules are testable and documented.

---

### Phase 3: Trust Layer (ERC-8004 Integration)
**Goal:** Make the agent verifiable and transparent.

**Tasks:**
- Mint agent identity NFT on ERC-8004 testnet.
- Implement EIP-712 signature generation for trade intents.
- Post signed intent to ERC-8004 registry before every trade.
- Integrate Risk Router: enforce leverage/drawdown limits before trade.
- Unit test: Simulate intent posting, verify on-chain record.

**Checkpoints:**
- Every trade intent is signed and posted on-chain.
- Risk Router blocks trades that violate guardrails.

---

### Phase 4: Execution & Automation
**Goal:** Connect AI logic to Kraken CLI for real trading.

**Tasks:**
- Integrate with Kraken CLI (subprocess or MCP server).
- Automate trade execution based on AI output.
- After trade, fetch Kraken `tx_id` and post validation artifact to ERC-8004.
- Implement error handling: rate limits, stale data, circuit breakers.
- End-to-end test: Simulate a full trade cycle (decision → intent → execution → proof).

**Checkpoints:**
- Trades only execute if all guardrails pass.
- On-chain proof links intent and execution.

---

### Phase 5: Performance & Social Build
**Goal:** Optimize performance and maximize social engagement.

**Tasks:**
- Track and display Sharpe Ratio, drawdown, and other metrics.
- Auto-post trade summaries and validation artifacts to X/Twitter.
- Build a simple dashboard for live stats and proof links.
- Tag required accounts in all posts.

**Checkpoints:**
- Dashboard updates in real time.
- Social posts are automated and include proof links.

---

### Phase 6: Final Submission
**Goal:** Deliver a complete, polished, and verifiable package.

**Tasks:**
- Record a 2-minute demo video.
- Clean up code, write clear README, and MIT license.
- Prepare presentation slides focusing on trust and risk control.
- Submit all required links (GitHub, ERC-8004 proofs, video).

**Checkpoints:**
- All submission requirements met.
- Demo shows full trust loop in action.

---

## 🛡️ Fool-Proofing & Best Practices

- Use environment variables for all secrets.
- Write unit tests for every critical function (especially risk logic).
- Use logging for all key actions (decisions, trades, errors).
- Implement fallback and alerting for API failures.
- Document every integration point (PRISM, Kraken, ERC-8004).

---

## 📅 Suggested Timeline

- **Days 1-2:** Phase 1
- **Days 3-5:** Phase 2
- **Days 6-8:** Phase 3
- **Days 9-10:** Phase 4
- **Days 11-13:** Phase 5
- **Day 14:** Phase 6
