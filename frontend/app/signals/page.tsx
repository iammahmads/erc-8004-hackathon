'use client';

import { useTradeDecision } from '@/lib/hooks';
import { SignalWidget } from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/loading';
import { RefreshCw, BarChart3 } from 'lucide-react';

export default function MarketSignals() {
  const { data: decision, loading, error, refetch } = useTradeDecision();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Market Data</h1>
            <p className="mt-1 text-slate-400">Macro and crypto signal analysis</p>
          </div>
          <Button disabled variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <LoadingState message="Loading market signals..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Market Data</h1>
          <p className="mt-1 text-slate-400">Macro and crypto signal analysis</p>
        </div>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <ErrorState message={error} />}

      {decision ? (
        <>
          {/* Signal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SignalWidget
              symbol="S&P 500 (SPX)"
              sentiment={decision.spx?.sentiment as any || 'neutral'}
              volatility={decision.spx?.volatility || 0}
              price={decision.spx?.price}
            />
            <SignalWidget
              symbol="Bitcoin (BTC)"
              sentiment={decision.btc_signal?.sentiment as any || 'neutral'}
              volatility={decision.btc_signal?.volatility || 0}
              price={decision.btc_signal?.price}
            />
            <SignalWidget
              symbol="Macro"
              sentiment={decision.macro?.sentiment as any || 'neutral'}
              volatility={decision.macro?.volatility || 0}
            />
          </div>

          {/* Detailed Analysis */}
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Signal Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* S&P 500 Details */}
              <Card>
                <CardHeader>
                  <CardTitle>S&P 500 (SPX)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Volatility</span>
                    <span className="font-mono font-bold text-slate-100">
                      {decision.spx?.volatility?.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sentiment</span>
                    <span className="font-bold text-slate-100 capitalize">
                      {decision.spx?.sentiment || 'Neutral'}
                    </span>
                  </div>
                  {decision.spx?.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="font-mono font-bold text-slate-100">
                        ${decision.spx.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {decision.spx?.trend && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Trend</span>
                      <span className="font-bold text-slate-100 capitalize">
                        {decision.spx.trend}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bitcoin Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Bitcoin (BTC)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Volatility</span>
                    <span className="font-mono font-bold text-slate-100">
                      {decision.btc_signal?.volatility?.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sentiment</span>
                    <span className="font-bold text-slate-100 uppercase">
                      {decision.btc_signal?.sentiment || 'Neutral'}
                    </span>
                  </div>
                  {decision.btc_signal?.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="font-mono font-bold text-slate-100">
                        ${decision.btc_signal.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {decision.btc_signal?.trend && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Trend</span>
                      <span className="font-bold text-slate-100 capitalize">
                        {decision.btc_signal.trend}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Macro Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Macro Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Volatility Index</span>
                    <span className="font-mono font-bold text-slate-100">
                      {decision.macro?.volatility?.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Macro Sentiment</span>
                    <span className="font-bold text-slate-100 capitalize">
                      {decision.macro?.sentiment || 'Neutral'}
                    </span>
                  </div>
                  {decision.macro?.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Reference Price</span>
                      <span className="font-mono font-bold text-slate-100">
                        ${decision.macro.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <p className="text-sm text-slate-400 mb-2">Current Market Conditions</p>
                  <p className="text-slate-100">
                    SPX volatility at{' '}
                    <span className="font-bold text-blue-400">
                      {decision.spx?.volatility?.toFixed(2)}%
                    </span>
                    , BTC showing{' '}
                    <span
                      className={
                        decision.btc_signal?.sentiment === 'bullish'
                          ? 'font-bold text-green-400'
                          : decision.btc_signal?.sentiment === 'bearish'
                          ? 'font-bold text-red-400'
                          : 'font-bold text-yellow-400'
                      }
                    >
                      {decision.btc_signal?.sentiment || 'neutral'} sentiment
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-sm text-slate-500">
            Last updated: {decision.timestamp || new Date().toISOString()}
          </div>
        </>
      ) : (
        <EmptyState message="No market data available" />
      )}
    </div>
  );
}
