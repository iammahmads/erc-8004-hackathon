'use client';

import { useTradeDecision, useSignTradeIntent, useExecuteTrade } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/loading';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const SEPOLIA_EXPLORER = process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER || 'https://sepolia.etherscan.io';

export default function TradeDetails() {
  const { data: decision, loading, error, refetch } = useTradeDecision();
  const { mutate: signTrade, loading: signingLoading, error: signError } = useSignTradeIntent();
  const { mutate: executeTrade, loading: executeLoading, error: executeError } = useExecuteTrade();
  const [signed, setSigned] = useState<{ signature: string } | null>(null);
  const [executed, setExecuted] = useState<{ order_id: string; status: string } | null>(null);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [executeErrorMsg, setExecuteErrorMsg] = useState<string | null>(null);

  const handleSignTrade = async () => {
    if (!decision?.llm_decision) return;

    try {
      setSigningError(null);
      const { action, amount, reasoning } = decision.llm_decision;
      const result = await signTrade({ action, amount, reasoning });
      setSigned(result as { signature: string });
    } catch (err) {
      setSigningError(err instanceof Error ? err.message : 'Failed to sign trade');
    }
  };

  const handleExecuteTrade = async () => {
    if (!decision?.llm_decision) return;

    try {
      setExecuteErrorMsg(null);
      const { action, amount } = decision.llm_decision;
      const result = await executeTrade({ action, amount });
      setExecuted(result as { order_id: string; status: string });
    } catch (err) {
      setExecuteErrorMsg(err instanceof Error ? err.message : 'Failed to execute trade');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Trade Decision</h1>
          <p className="mt-1 text-slate-400">LLM reasoning and on-chain validation</p>
        </div>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading && <LoadingState message="Loading trade decision..." />}
      {error && <ErrorState message={error} />}

      {decision?.llm_decision ? (
        <>
          {/* Main Trade Card */}
          <Card className="border-2 border-blue-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Current Trade Decision</span>
                <Badge
                  variant={
                    decision.llm_decision.action === 'BUY'
                      ? 'success'
                      : decision.llm_decision.action === 'SELL'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {decision.llm_decision.action}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Action</p>
                  <p className="text-3xl font-bold text-slate-100">{decision.llm_decision.action}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-3xl font-bold text-slate-100">{decision.llm_decision.amount} BTC</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Reasoning</p>
                <p className="text-slate-200 leading-relaxed bg-slate-700/20 p-4 rounded-lg">
                  {decision.llm_decision.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signal Sources */}
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-4">Signal Sources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SPX Signal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">S&P 500 (SPX)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Volatility</p>
                    <p className="text-lg font-bold text-slate-100">
                      {decision.spx?.volatility?.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Sentiment</p>
                    <Badge variant="secondary">{decision.spx?.sentiment || 'Neutral'}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                    {decision.spx?.volatility && decision.spx.volatility < 0.15
                      ? 'Low volatility - stable market'
                      : decision.spx?.volatility && decision.spx.volatility > 0.25
                      ? 'High volatility - uncertain market'
                      : 'Moderate volatility'}
                  </div>
                </CardContent>
              </Card>

              {/* BTC Signal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bitcoin (BTC)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Volatility</p>
                    <p className="text-lg font-bold text-slate-100">
                      {decision.btc_signal?.volatility?.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Sentiment</p>
                    <Badge
                      variant={
                        decision.btc_signal?.sentiment === 'bullish'
                          ? 'success'
                          : decision.btc_signal?.sentiment === 'bearish'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {decision.btc_signal?.sentiment || 'Neutral'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                    {decision.btc_signal?.sentiment === 'bullish'
                      ? 'Strong buy signal'
                      : decision.btc_signal?.sentiment === 'bearish'
                      ? 'Sell pressure detected'
                      : 'No clear direction'}
                  </div>
                </CardContent>
              </Card>

              {/* Macro Signal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Macro Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Volatility Index</p>
                    <p className="text-lg font-bold text-slate-100">
                      {decision.macro?.volatility?.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Sentiment</p>
                    <Badge variant="secondary">{decision.macro?.sentiment || 'Neutral'}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                    Overall macro environment assessment
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Decision Risk Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Decision Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Risk Mode</p>
                <Badge
                  variant={
                    decision.risk_mode === 'conservative'
                      ? 'secondary'
                      : decision.risk_mode === 'aggressive'
                      ? 'destructive'
                      : 'warning'
                  }
                >
                  {decision.risk_mode?.charAt(0).toUpperCase() + (decision.risk_mode?.slice(1) || 'Unknown')}
                </Badge>
              </div>
              <div className="pt-4 border-t border-slate-700 text-sm text-slate-400">
                <p>
                  Position size: <span className="text-slate-200 font-semibold">{decision.llm_decision.amount} BTC</span>
                </p>
                <p className="mt-1">
                  Based on risk mode:{' '}
                  <span className="text-slate-200 font-semibold">
                    {decision.risk_mode === 'conservative'
                      ? 'Small positions'
                      : decision.risk_mode === 'aggressive'
                      ? 'Larger positions'
                      : 'Medium positions'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* On-Chain Validation */}
          <Card className="border border-blue-800/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                On-Chain Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {signingError && (
                <div className="p-4 rounded-lg bg-red-900/10 border border-red-800/30">
                  <p className="text-sm text-red-300 flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {signingError}
                  </p>
                </div>
              )}

              {executeErrorMsg && (
                <div className="p-4 rounded-lg bg-red-900/10 border border-red-800/30">
                  <p className="text-sm text-red-300 flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {executeErrorMsg}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-slate-400">
                  This trade decision will be:
                </p>
                <ol className="space-y-2 text-sm text-slate-300 ml-4 list-decimal">
                  <li>Cryptographically signed (EIP-712)</li>
                  <li>Posted on Sepolia testnet (ERC-8004 contract)</li>
                  <li>Permanently recorded on-chain for transparency</li>
                  <li>Executed on Kraken with trade ID linking</li>
                </ol>
              </div>

              {signed && (
                <div className="p-4 rounded-lg bg-green-900/10 border border-green-800/30">
                  <p className="text-xs text-green-300 mb-2">Signature Generated:</p>
                  <code className="text-xs font-mono text-green-200 break-all">{signed.signature}</code>
                </div>
              )}

              {executed && (
                <div className="p-4 rounded-lg bg-green-900/10 border border-green-800/30">
                  <p className="text-xs text-green-300 mb-2">Trade Executed:</p>
                  <p className="text-sm font-mono text-green-200">Order ID: {executed.order_id}</p>
                  <p className="text-sm font-mono text-green-200">Status: {executed.status}</p>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={handleSignTrade} 
                  className="w-full" 
                  disabled={!!signed || signingLoading}
                >
                  {signingLoading ? 'Signing...' : signed ? 'Trade Signed ✓' : 'Sign Trade for On-Chain Post'}
                </Button>
                
                {signed && (
                  <Button 
                    onClick={handleExecuteTrade} 
                    className="w-full bg-green-700 hover:bg-green-600" 
                    disabled={!!executed || executeLoading}
                  >
                    {executeLoading ? 'Executing...' : executed ? '✓ Trade Executed' : 'Execute Trade on Kraken'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamp */}
          <div className="text-xs text-slate-500">
            Decision timestamp: {decision.timestamp || new Date().toISOString()}
          </div>
        </>
      ) : (
        <EmptyState message="No trade decision available" />
      )}
    </div>
  );
}
