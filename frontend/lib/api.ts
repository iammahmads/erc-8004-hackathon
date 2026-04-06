import * as T from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(response.status, error.detail || error.message || 'API Error');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error');
  }
}

// Health check
export async function checkHealth(): Promise<T.HealthStatus> {
  try {
    const health = await fetchAPI<T.HealthStatus>('/status');
    return { ...health, backend_url: BASE_URL };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Backend unavailable',
      backend_url: BASE_URL,
    };
  }
}

// Trade decisions and signals
export async function decideAndTrade(): Promise<T.TradeDecision> {
  return fetchAPI<T.TradeDecision>('/decide_trade');
}

export async function signTradeIntent(action: string, amount: number, reasoning: string): Promise<{ signature: string }> {
  return fetchAPI('/sign_intent', {
    method: 'POST',
    body: JSON.stringify({ action, amount, reasoning }),
  });
}

export async function executeTrade(action: string, amount: number): Promise<{ order_id: string; status: string }> {
  return fetchAPI('/execute_trade', {
    method: 'POST',
    body: JSON.stringify({ action, amount }),
  });
}

export async function postArtifact(artifact: {
  action: string;
  amount: number;
  reasoning_hash: string;
  txId: string;
  compliant: boolean;
}): Promise<{ tx_hash: string }> {
  return fetchAPI('/post_artifact', {
    method: 'POST',
    body: JSON.stringify(artifact),
  });
}

// Metrics
export async function getMetrics(): Promise<T.PerformanceMetrics> {
  return fetchAPI<T.PerformanceMetrics>('/metrics');
}

// Agent operations
export async function registerAgent(): Promise<{ nft_id: string; tx_hash: string }> {
  return fetchAPI('/register_agent', { method: 'POST' });
}

export async function getReputation(address: string): Promise<T.AgentReputation> {
  return fetchAPI<T.AgentReputation>(`/reputation/${address}`);
}

export async function getArtifacts(address: string): Promise<T.Artifact[]> {
  return fetchAPI<T.Artifact[]>(`/artifacts/${address}`);
}

export async function logTrade(trade: T.Trade | Partial<T.Trade>): Promise<{ id: string; logged: boolean }> {
  return fetchAPI('/log_trade', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
}

// Get trade history
export async function getTradeHistory(): Promise<T.Trade[]> {
  try {
    return await fetchAPI<T.Trade[]>('/trades');
  } catch {
    // If trades endpoint doesn't exist, return empty array
    return [];
  }
}

// Close trade position (update with exit price)
export async function closePosition(tradeId: string, exitPrice: number): Promise<{ id: string; updated: boolean }> {
  return fetchAPI(`/trades/${tradeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ exit_price: exitPrice, status: 'closed' }),
  });
}

// Update trade
export async function updateTrade(tradeId: string, updates: Partial<T.Trade>): Promise<{ id: string; updated: boolean }> {
  return fetchAPI(`/trades/${tradeId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Delete trade
export async function deleteTrade(tradeId: string): Promise<{ id: string; deleted: boolean }> {
  return fetchAPI(`/trades/${tradeId}`, {
    method: 'DELETE',
  });
}

// Auto-trade: full autonomous pipeline
export async function autoTrade(): Promise<{
  timestamp: string;
  action: string;
  executed: boolean;
  trade_id: string | null;
  order_id: string | null;
  mode: string;
  message?: string;
  decision: { action: string; amount: number; reasoning: string };
  risk_mode: string;
}> {
  return fetchAPI('/auto-trade', { method: 'POST' });
}

export { ApiError };
