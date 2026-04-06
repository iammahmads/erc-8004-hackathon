// Market signals types
export interface MacroSignal {
  volatility: number;
  sentiment: string;
  price?: number;
  trend?: string;
}

export interface MarketSignals {
  macro: MacroSignal;
  spx: MacroSignal;
  btc_signal: MacroSignal;
  [key: string]: MacroSignal;
}

// LLM Decision
export interface LLMDecision {
  action: "BUY" | "SELL" | "HOLD";
  amount: number;
  reasoning: string;
}

// Trade Decision Response
export interface TradeDecision {
  macro: MacroSignal;
  spx: MacroSignal;
  btc_signal: MacroSignal;
  risk_mode: "conservative" | "moderate" | "aggressive";
  llm_decision: LLMDecision;
  timestamp?: string;
}

// On-chain Artifact
export interface Artifact {
  id: string;
  action: string;
  amount: number;
  reasoning_hash: string;
  txId: string;
  compliant: boolean;
  timestamp: string;
  block_number?: number;
}

// Performance Metrics
export interface PerformanceMetrics {
  sharpe_ratio: number;
  max_drawdown: number;
  total_return: number;
  win_rate?: number;
  avg_trade_size?: number;
  total_trades?: number;
  timestamp?: string;
}

// Agent Reputation
export interface AgentReputation {
  address: string;
  compliant_trades: number;
  total_trades: number;
  nft_id?: string;
  mint_date?: string;
  reputation_score?: number;
}

// Trade History
export interface Trade {
  id: string;
  timestamp: string;
  action: "BUY" | "SELL";
  amount: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  status: "open" | "closed" | "executed";
  kraken_order_id?: string;
  on_chain_tx?: string;
}

// API Error
export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
}

// Health Status
export interface HealthStatus {
  status: "healthy" | "unhealthy";
  message: string;
  backend_url?: string;
}
