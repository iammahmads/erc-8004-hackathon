'use client';

import { useState, useEffect } from 'react';
import { useMetrics, useTradeDecision, useReputation } from '@/lib/hooks';
import { MetricCard, TradeCard, RiskModeBadge } from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/loading';
import { RefreshCw, CheckCircle, AlertCircle, ExternalLink, Bot, Zap } from 'lucide-react';
import * as api from '@/lib/api';

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0x0740DeB986e2C7B7D4b4F3Aa4C2875a411380485';

export default function Home() {
  const { data: metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useMetrics();
  const { data: decision, loading: decisionLoading, error: decisionError, refetch: refetchDecision } = useTradeDecision();
  const { data: reputation } = useReputation(AGENT_ADDRESS);
  const [nftData, setNftData] = useState<any>(null);
  const [autoTradeResult, setAutoTradeResult] = useState<any>(null);
  const [autoTradeLoading, setAutoTradeLoading] = useState(false);
  const [autoTradeError, setAutoTradeError] = useState<string | null>(null);

  // Load NFT data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`agent_nft_${AGENT_ADDRESS}`);
    if (stored) {
      try {
        setNftData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse NFT data:', e);
      }
    }
  }, []);

  const handleRefresh = async () => {
    await refetchMetrics();
    await refetchDecision();
  };

  const handleAutoTrade = async () => {
    setAutoTradeLoading(true);
    setAutoTradeError(null);
    try {
      const result = await api.autoTrade();
      setAutoTradeResult(result);
      // Refresh metrics and trades after execution
      await refetchMetrics();
    } catch (err) {
      setAutoTradeError(err instanceof Error ? err.message : 'Auto-trade failed');
    } finally {
      setAutoTradeLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-1 text-slate-400">Real-time trading metrics and agent performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoTrade}
            disabled={autoTradeLoading}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
          >
            {autoTradeLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {autoTradeLoading ? 'Running...' : 'Auto-Trade Now'}
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auto-Trade Result */}
      {(autoTradeResult || autoTradeError) && (
        <Card className={`border ${autoTradeError
            ? 'bg-red-950/20 border-red-500/30'
            : autoTradeResult?.executed
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-slate-800/50 border-slate-700'
          }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Auto-Trade Result
              {autoTradeResult && (
                <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded ${autoTradeResult.mode === 'live'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                  {autoTradeResult.mode?.toUpperCase() || 'PAPER'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {autoTradeError ? (
              <p className="text-red-300">{autoTradeError}</p>
            ) : autoTradeResult ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Action</span>
                  <span className={`font-bold ${autoTradeResult.action === 'BUY' ? 'text-green-400'
                      : autoTradeResult.action === 'SELL' ? 'text-red-400'
                        : 'text-slate-300'
                    }`}>{autoTradeResult.action}</span>
                </div>
                {autoTradeResult.order_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID</span>
                    <span className="font-mono text-xs text-blue-300">{autoTradeResult.order_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Mode</span>
                  <span className="text-slate-200">{autoTradeResult.risk_mode}</span>
                </div>
                <div className="pt-1 text-xs text-slate-400 italic">
                  {autoTradeResult.decision?.reasoning || autoTradeResult.message}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Agent NFT Identity Card */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {nftData ? <CheckCircle className="h-5 w-5 text-green-400" /> : <AlertCircle className="h-5 w-5 text-yellow-400" />}
            Agent NFT Identity ({nftData ? 'ERC-8004 Verified' : 'Pending Registration'})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nftData ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">NFT ID:</span>
                <span className="text-slate-100 font-mono">#{nftData.nft_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-green-400 font-semibold">✓ Minted</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reputation Score:</span>
                <span className="text-blue-400 font-semibold">{reputation?.reputation_score || 0}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tx Hash:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${nftData.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-xs truncate flex items-center gap-1"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Agent NFT not yet minted. Go to the Agent Profile page to mint your on-chain identity.</p>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4">Performance Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricsLoading ? (
            <>
              <div className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
              <div className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
              <div className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
            </>
          ) : metricsError ? (
            <ErrorState message={metricsError} />
          ) : metrics ? (
            <>
              <MetricCard
                label="Sharpe Ratio"
                value={metrics.sharpe_ratio?.toFixed(2) ?? 'N/A'}
                trend={metrics.sharpe_ratio > 1 ? 'up' : 'down'}
              />
              <MetricCard
                label="Max Drawdown"
                value={`${(metrics.max_drawdown * 100).toFixed(2)}%`}
                trend="down"
              />
              <MetricCard
                label="Total Return"
                value={`${(metrics.total_return * 100).toFixed(2)}%`}
                trend={metrics.total_return > 0 ? 'up' : 'down'}
              />
            </>
          ) : (
            <EmptyState message="No metrics available" />
          )}
        </div>
      </div>

      {/* Latest Trade Decision */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">Latest Trade Decision</h2>
          {decision?.risk_mode && <RiskModeBadge mode={decision.risk_mode} />}
        </div>

        {decisionLoading ? (
          <LoadingState message="Fetching latest decision..." />
        ) : decisionError ? (
          <ErrorState message={decisionError} />
        ) : decision?.llm_decision ? (
          <div className="space-y-4">
            <TradeCard
              action={decision.llm_decision.action}
              amount={decision.llm_decision.amount}
              reasoning={decision.llm_decision.reasoning}
              timestamp={decision.timestamp}
            />

            {/* Signal Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Signal Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">S&P 500 (SPX)</p>
                    <p className="text-lg font-bold text-slate-100">
                      Vol: {decision.spx?.volatility?.toFixed(2)}%
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Sentiment: {decision.spx?.sentiment || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Bitcoin (BTC)</p>
                    <p className="text-lg font-bold text-slate-100">
                      {decision.btc_signal?.sentiment?.toUpperCase() || 'NEUTRAL'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Vol: {decision.btc_signal?.volatility?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Macro</p>
                    <p className="text-lg font-bold text-slate-100">
                      Vol: {decision.macro?.volatility?.toFixed(2)}%
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {decision.macro?.sentiment || 'Neutral'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState message="No trade decision available" />
        )}
      </div>
    </div>
  );
}
