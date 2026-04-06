'use client';

import { useState } from 'react';
import {
  signTradeIntent,
  postTradeArtifact,
  getAgentReputation,
  getCurrentAddress,
} from './web3';

interface TradeData {
  action: 'BUY' | 'SELL';
  amount: number;
  entryPrice: number;
  exitPrice: number;
  pair?: string;
}

interface TradeExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  step?: number;
}

export function useTradeExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0: ready, 1: signing, 2: submitting, 3: posting artifact, 4: complete

  const executeTrade = async (trade: TradeData): Promise<TradeExecutionResult> => {
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);

      // Step 1: Sign trade intent (EIP-712)
      console.log('📝 Step 1: Signing trade intent...');
      setStep(1);

      const signResult = await signTradeIntent(
        trade.action,
        trade.amount,
        trade.entryPrice,
        trade.exitPrice,
        trade.pair || 'BTC/USD'
      );

      console.log('✅ Trade intent signed successfully');

      // Step 2: Submit to backend (which calls Risk Router)
      console.log('🚀 Step 2: Submitting to Risk Router...');
      setStep(2);

      const submitResponse = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeIntent: signResult.message,
          signature: signResult.signature,
          action: trade.action,
          amount: trade.amount,
          pair: trade.pair || 'BTC/USD',
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Trade submission failed');
      }

      const submitData = await submitResponse.json();
      const receivedTxHash = submitData.tx_hash || submitData.txHash;

      if (!receivedTxHash) {
        throw new Error('No transaction hash returned');
      }

      setTxHash(receivedTxHash);
      console.log('✅ Trade submitted. TX:', receivedTxHash);

      // Step 3: Post artifact on Validation Registry
      console.log('📋 Step 3: Posting artifact...');
      setStep(3);

      try {
        // Create reasoning hash from trade details
        const reasoningHash =
          '0x' +
          Buffer.from(
            `AI Trade: ${trade.action} ${trade.amount} @ ${trade.entryPrice}-${trade.exitPrice}`
          )
            .toString('hex')
            .padStart(64, '0');

        await postTradeArtifact(
          receivedTxHash,
          trade.action,
          trade.amount.toString(),
          true, // Mark as compliant
          reasoningHash
        );

        console.log('✅ Artifact posted successfully');
      } catch (artifactError) {
        console.warn('⚠️ Artifact posting failed (non-critical):', artifactError);
        // Don't fail the whole trade if artifact posting fails
      }

      // Step 4: Complete
      console.log('🎉 Trade execution complete!');
      setStep(4);

      return {
        success: true,
        txHash: receivedTxHash,
        step: 4,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Trade execution failed:', message);
      setError(message);
      return {
        success: false,
        error: message,
        step,
      };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setTxHash(null);
    setStep(0);
  };

  return {
    executeTrade,
    loading,
    error,
    txHash,
    step,
    reset,
  };
}

/**
 * Hook for registering agent (NFT minting)
 */
export function useAgentRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const registerAgent = async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Call backend to register agent
      const response = await fetch('/api/register-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      const hash = data.tx_hash || data.txHash;

      if (hash) {
        setTxHash(hash);
        // Store to localStorage
        localStorage.setItem('agent_nft_hash', hash);
        localStorage.setItem('agent_registered', 'true');
      }

      return { success: true, txHash: hash };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    registerAgent,
    loading,
    error,
    txHash,
  };
}

/**
 * Hook for tracking agent reputation
 */
export function useAgentReputation(address?: string) {
  const [reputation, setReputation] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = async (agentAddress: string) => {
    try {
      setLoading(true);
      setError(null);

      const score = await getAgentReputation(agentAddress);
      setReputation(score);

      return score;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reputation';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    reputation,
    loading,
    error,
    fetchReputation,
  };
}

/**
 * Hook for wallet connection
 */
export function useWalletConnection() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      setLoading(true);
      setError(null);

      const addr = await getCurrentAddress();
      if (addr) {
        setAddress(addr);
        setConnected(true);
      }

      return addr;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setConnected(false);
  };

  return {
    connected,
    address,
    loading,
    error,
    connect,
    disconnect,
  };
}
