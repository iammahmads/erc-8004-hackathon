'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, unit, trend, icon, className }: MetricCardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100">{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </p>
        </div>
        <div className="flex-shrink-0">
          {icon && <div className="text-blue-400">{icon}</div>}
          {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
        </div>
      </div>
    </Card>
  );
}

interface TradeCardProps {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  reasoning: string;
  timestamp?: string;
  className?: string;
}

export function TradeCard({ action, amount, reasoning, timestamp, className }: TradeCardProps) {
  const isPositive = action === 'BUY';

  return (
    <Card className={className}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'rounded-lg p-3 font-bold',
            isPositive ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
          )}
        >
          {action}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-100">{amount} BTC</p>
            {timestamp && <span className="text-xs text-slate-500">{timestamp}</span>}
          </div>
          <p className="mt-2 text-sm text-slate-300 line-clamp-2">{reasoning}</p>
        </div>
      </div>
    </Card>
  );
}

interface SignalWidgetProps {
  symbol: string;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  volatility: number;
  price?: number;
  className?: string;
}

export function SignalWidget({ symbol, sentiment, volatility, price, className }: SignalWidgetProps) {
  const sentimentColors = {
    bullish: 'text-green-400 bg-green-900/20 border-green-800',
    neutral: 'text-slate-400 bg-slate-700/20 border-slate-700',
    bearish: 'text-red-400 bg-red-900/20 border-red-800',
  };

  return (
    <Card className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">{symbol}</h3>
          <span className={cn('text-xs font-bold px-2 py-1 rounded border', sentimentColors[sentiment])}>
            {sentiment.toUpperCase()}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Volatility:</span>
            <span className="font-mono text-slate-200">{volatility.toFixed(2)}%</span>
          </div>
          {price && (
            <div className="flex justify-between">
              <span className="text-slate-400">Price:</span>
              <span className="font-mono text-slate-200">${price.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface RiskModeBadgeProps {
  mode: 'conservative' | 'moderate' | 'aggressive';
}

export function RiskModeBadge({ mode }: RiskModeBadgeProps) {
  const colors = {
    conservative: 'bg-blue-900/30 text-blue-300 border-blue-800',
    moderate: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
    aggressive: 'bg-red-900/30 text-red-300 border-red-800',
  };

  return (
    <div
      className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium', colors[mode])}
    >
      <Zap className="h-4 w-4" />
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </div>
  );
}
