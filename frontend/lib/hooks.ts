'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api';
import * as T from './types';

// Request deduplication cache to prevent simultaneous duplicate requests
const requestCache = new Map<string, Promise<any>>();

// Generic fetch hook
export function useFetch<T>(
  fn: () => Promise<T>,
  options?: { 
    interval?: number
    immediate?: boolean
    retries?: number
    retryDelay?: number
    backoffMultiplier?: number
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const pendingRequestRef = useRef<Promise<T> | null>(null);
  const retryCountRef = useRef(0);

  const maxRetries = options?.retries ?? 3;
  const initialDelay = options?.retryDelay ?? 1000; // 1 second
  const backoffMultiplier = options?.backoffMultiplier ?? 2;

  const refetch = useCallback(async () => {
    // Prevent duplicate simultaneous requests
    if (pendingRequestRef.current) {
      return pendingRequestRef.current;
    }

    setLoading(true);
    setError(null);

    try {
      const promise = fn();
      pendingRequestRef.current = promise;
      const result = await promise;

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        retryCountRef.current = 0; // Reset retry counter on success
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        
        // Implement retry logic
        if (retryCountRef.current < maxRetries) {
          const delay = initialDelay * Math.pow(backoffMultiplier, retryCountRef.current);
          retryCountRef.current += 1;
          
          // Clear any existing retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          // Schedule retry
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              pendingRequestRef.current = null;
              refetchRef.current?.();
            }
          }, delay);
        } else {
          retryCountRef.current = 0; // Reset after max retries exhausted
        }
      }
    } finally {
      pendingRequestRef.current = null;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fn, maxRetries, initialDelay, backoffMultiplier]);

  // Use ref to store current refetch without causing effect re-runs
  const refetchRef = useRef(refetch);
  
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Handle initial fetch and interval setup
  // Only depends on interval/immediate options, NOT on refetch
  // This prevents unnecessary re-runs when the fn function changes
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    if (options?.immediate !== false) {
      refetchRef.current?.();
    }

    // Setup interval if specified
    if (options?.interval && options.interval > 0) {
      intervalRef.current = setInterval(() => refetchRef.current?.(), options.interval);
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [options?.interval, options?.immediate]);

  return { data, loading, error, refetch };
}

// Metrics hook - polls every 30 seconds
export function useMetrics() {
  return useFetch(() => api.getMetrics(), { interval: 30000 });
}

// Trade decision hook
export function useTradeDecision() {
  return useFetch(() => api.decideAndTrade(), { interval: 30000 });
}

// Agent reputation hook
export function useReputation(address: string) {
  return useFetch(() => api.getReputation(address), { interval: 60000 });
}

// Artifacts (on-chain trade history) hook
export function useArtifacts(address: string) {
  return useFetch(() => api.getArtifacts(address), { interval: 60000 });
}

// Health check hook
export function useHealth() {
  return useFetch(() => api.checkHealth(), { interval: 5000 });
}

// Mutation hook
export function useMutation<T, R = void>(
  fn: (data: T) => Promise<R>,
  options?: {
    retries?: number
    retryDelay?: number
    backoffMultiplier?: number
  }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<R | null>(null);
  const pendingRequestRef = useRef<Promise<R> | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const maxRetries = options?.retries ?? 3;
  const initialDelay = options?.retryDelay ?? 1000; // 1 second
  const backoffMultiplier = options?.backoffMultiplier ?? 2;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  const mutate = useCallback(
    async (variables: T) => {
      // Prevent duplicate simultaneous requests
      if (pendingRequestRef.current) {
        return pendingRequestRef.current;
      }

      setLoading(true);
      setError(null);
      retryCountRef.current = 0;

      const attemptRequest = async (): Promise<R> => {
        try {
          const promise = fn(variables);
          pendingRequestRef.current = promise;
          const result = await promise;

          if (isMountedRef.current) {
            setData(result);
            retryCountRef.current = 0;
          }
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error';

          if (isMountedRef.current) {
            // Implement retry logic
            if (retryCountRef.current < maxRetries) {
              const delay = initialDelay * Math.pow(backoffMultiplier, retryCountRef.current);
              retryCountRef.current += 1;

              // Schedule retry
              return new Promise((resolve, reject) => {
                retryTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current) {
                    pendingRequestRef.current = null;
                    attemptRequest().then(resolve).catch(reject);
                  } else {
                    reject(new Error('Component unmounted'));
                  }
                }, delay);
              });
            } else {
              if (isMountedRef.current) {
                setError(message);
              }
              retryCountRef.current = 0;
              throw err;
            }
          } else {
            throw err;
          }
        } finally {
          pendingRequestRef.current = null;
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      return attemptRequest();
    },
    [fn, maxRetries, initialDelay, backoffMultiplier]
  );

  return { mutate, loading, error, data };
}

// Sign trade intent mutation
export function useSignTradeIntent() {
  return useMutation(
    (variables: { action: string; amount: number; reasoning: string }) =>
      api.signTradeIntent(variables.action, variables.amount, variables.reasoning)
  );
}

// Execute trade mutation
export function useExecuteTrade() {
  return useMutation((variables: { action: string; amount: number }) =>
    api.executeTrade(variables.action, variables.amount)
  );
}

// Register agent mutation
export function useRegisterAgent() {
  return useMutation(() => api.registerAgent());
}

// Log trade mutation
export function useLogTrade() {
  return useMutation((trade: {
    action: "BUY" | "SELL";
    amount: number;
    entry_price: number;
    exit_price?: number;
    status?: "open" | "closed";
    timestamp?: string;
    pnl?: number;
  }) => api.logTrade(trade as T.Trade));
}

// Trade history hook
export function useTradeHistory() {
  return useFetch(() => api.getTradeHistory(), { interval: 60000 });
}

// Close position mutation
export function useClosePosition() {
  return useMutation((variables: { tradeId: string; exitPrice: number }) =>
    api.closePosition(variables.tradeId, variables.exitPrice)
  );
}

// Update trade mutation
export function useUpdateTrade() {
  return useMutation((variables: { tradeId: string; updates: any }) =>
    api.updateTrade(variables.tradeId, variables.updates)
  );
}

// Delete trade mutation
export function useDeleteTrade() {
  return useMutation((tradeId: string) => api.deleteTrade(tradeId));
}
