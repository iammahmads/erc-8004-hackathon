'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as T from '@/lib/types';

interface PerformanceChartsProps {
  trades: T.Trade[];
}

export function PerformanceCharts({ trades }: PerformanceChartsProps) {
  // Prepare cumulative P&L data
  const cumulativePnLData = trades
    .filter((t) => t.status === 'closed')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((acc, trade, index) => {
      const cumulativePnL = (acc[index - 1]?.cumulativePnL || 0) + (trade.pnl || 0);
      acc.push({
        date: new Date(trade.timestamp).toLocaleDateString(),
        cumulativePnL: parseFloat(cumulativePnL.toFixed(2)),
        pnl: trade.pnl,
      });
      return acc;
    }, [] as any[]);

  // Prepare monthly performance data
  const monthlyData = trades
    .filter((t) => t.status === 'closed')
    .reduce((acc, trade) => {
      const date = new Date(trade.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthLabel,
          totalPnL: 0,
          wins: 0,
          losses: 0,
          count: 0,
        };
      }

      acc[monthKey].totalPnL += trade.pnl || 0;
      acc[monthKey].count += 1;
      if ((trade.pnl || 0) > 0) {
        acc[monthKey].wins += 1;
      } else if ((trade.pnl || 0) < 0) {
        acc[monthKey].losses += 1;
      }

      return acc;
    }, {} as Record<string, any>);

  const monthlyDataArray = Object.values(monthlyData).map((m: any) => ({
    ...m,
    totalPnL: parseFloat(m.totalPnL.toFixed(2)),
  }));

  // Prepare win rate trend data
  const winRateTrendData = trades
    .filter((t) => t.status === 'closed')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((acc, trade, index) => {
      const allTrades = trades.filter((t) => t.status === 'closed').slice(0, index + 1);
      const winningTrades = allTrades.filter((t) => (t.pnl || 0) > 0);
      const winRate = allTrades.length > 0 ? (winningTrades.length / allTrades.length) * 100 : 0;

      acc.push({
        tradeNumber: index + 1,
        winRate: parseFloat(winRate.toFixed(1)),
        date: new Date(trade.timestamp).toLocaleDateString(),
      });
      return acc;
    }, [] as any[]);

  return (
    <div className="space-y-6">
      {/* Cumulative P&L Chart */}
      {cumulativePnLData.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-100">Cumulative P&L Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativePnLData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `$${value}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativePnL"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Cumulative P&L"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Performance Chart */}
      {monthlyDataArray.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-100">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyDataArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `$${value}`}
                />
                <Legend />
                <Bar dataKey="totalPnL" fill="#10b981" name="Total P&L" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Win Rate Trend Chart */}
      {winRateTrendData.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-100">Win Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={winRateTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="tradeNumber" stroke="#94a3b8" style={{ fontSize: '12px' }} label={{ value: 'Trade #', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[0, 100]} label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Win Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
