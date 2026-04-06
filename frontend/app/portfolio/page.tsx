'use client';

import { useState } from 'react';
import { useTradeHistory, useClosePosition, useDeleteTrade, useUpdateTrade } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/loading';
import { AddTradeModal } from '@/components/AddTradeModal';
import { ClosePositionModal } from '@/components/ClosePositionModal';
import { EditTradeModal } from '@/components/EditTradeModal';
import { PerformanceCharts } from '@/components/PerformanceCharts';
import { RefreshCw, TrendingUp, TrendingDown, Download, Plus, X, Edit2 } from 'lucide-react';
import * as T from '@/lib/types';
import * as api from '@/lib/api';

export default function Portfolio() {
  const { data: tradesData, loading: tradesLoading, error: tradesError, refetch } = useTradeHistory();
  const { mutate: closePosition, loading: closingPosition } = useClosePosition();
  const { mutate: updateTrade, loading: updatingTrade } = useUpdateTrade();
  const { mutate: deleteTrade, loading: deletingTrade } = useDeleteTrade();
  
  const trades = tradesData || [];
  const [sortBy, setSortBy] = useState<'timestamp' | 'pnl'>('timestamp');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<T.Trade | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<T.Trade | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleAddTrade = async (trade: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.logTrade(trade);
      // Refresh the trade list
      await refetch();
      setIsAddModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePosition = (trade: T.Trade) => {
    setSelectedPosition(trade);
    setIsCloseModalOpen(true);
  };

  const handleConfirmClosePosition = async (exitPrice: number) => {
    if (!selectedPosition) return;
    try {
      await closePosition({ tradeId: selectedPosition.id, exitPrice });
      await refetch();
      setIsCloseModalOpen(false);
      setSelectedPosition(null);
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    try {
      await deleteTrade(tradeId);
      await refetch();
    } catch (error) {
      console.error('Failed to delete trade:', error);
    }
  };

  const handleEditTrade = (trade: T.Trade) => {
    setSelectedTrade(trade);
    setIsEditModalOpen(true);
  };

  const handleConfirmEditTrade = async (updates: Partial<T.Trade>) => {
    if (!selectedTrade) return;
    try {
      await updateTrade({ tradeId: selectedTrade.id, updates });
      await refetch();
      setIsEditModalOpen(false);
      setSelectedTrade(null);
    } catch (error) {
      console.error('Failed to update trade:', error);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Amount (BTC)', 'Entry Price', 'Exit Price', 'P&L', 'Status'],
      ...trades.map((t) => [
        t.timestamp,
        t.action,
        t.amount,
        `$${t.entry_price}`,
        t.exit_price ? `$${t.exit_price}` : 'N/A',
        t.pnl ? `$${t.pnl}` : 'N/A',
        t.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-trades.csv';
    a.click();
  };

  const sortedTrades = [...(trades || [])].sort((a, b) => {
    if (sortBy === 'pnl') {
      return (b.pnl || 0) - (a.pnl || 0);
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Apply filters
  const filteredTrades = sortedTrades.filter((trade) => {
    // Status filter
    if (filterStatus !== 'all' && trade.status !== filterStatus) {
      return false;
    }

    // Action filter
    if (filterAction !== 'all' && trade.action !== filterAction) {
      return false;
    }

    // Date range filter
    if (filterDateFrom) {
      const tradeDate = new Date(trade.timestamp).getTime();
      const fromDate = new Date(filterDateFrom).getTime();
      if (tradeDate < fromDate) {
        return false;
      }
    }

    if (filterDateTo) {
      const tradeDate = new Date(trade.timestamp).getTime();
      const toDate = new Date(filterDateTo).getTime();
      const toDateEnd = toDate + 86400000; // Add one day to include the entire day
      if (tradeDate > toDateEnd) {
        return false;
      }
    }

    return true;
  });

  const closedTrades = filteredTrades.filter((t) => t.status === 'closed');
  const openTrades = filteredTrades.filter((t) => t.status === 'open');
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0);
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / losingTrades.length : 0;
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Portfolio</h1>
          <p className="mt-1 text-slate-400">Trade history and performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Trade
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2" disabled={trades.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <AddTradeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTrade}
        loading={isSubmitting}
        error={submitError || ''}
      />

      <ClosePositionModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSubmit={handleConfirmClosePosition}
        loading={closingPosition}
        currentPrice={selectedPosition?.entry_price || 0}
      />

      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleConfirmEditTrade}
        trade={selectedTrade}
        loading={updatingTrade}
      />

      {/* Advanced Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Trades</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="BUY">Buy Only</option>
                <option value="SELL">Sell Only</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-2">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-2">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterAction('all');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                variant="outline"
                className="w-full text-sm"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {tradesLoading && <LoadingState message="Loading trade history..." />}
      {tradesError && <ErrorState message={tradesError} />}

      {!tradesLoading && !tradesError && (
        <>
          {/* Performance Charts */}
          {filteredTrades.length > 0 && <PerformanceCharts trades={filteredTrades} />}

          {/* Performance Summary */}
          {trades.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total P&L</p>
                    <p className={`mt-2 text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${totalPnL.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Win Rate</p>
                    <p className="mt-2 text-2xl font-bold text-slate-100">{winRate.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Win</p>
                    <p className="mt-2 text-2xl font-bold text-green-400">${avgWin.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Loss</p>
                    <p className="mt-2 text-2xl font-bold text-red-400">${avgLoss.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Open Positions */}
          {openTrades.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-4">Open Positions ({openTrades.length})</h2>
              <div className="space-y-3">
                {openTrades.map((trade) => (
                  <Card key={trade.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-lg p-3 font-bold text-sm ${
                              trade.action === 'BUY'
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-red-900/30 text-red-300'
                            }`}
                          >
                            {trade.action}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{trade.amount} BTC</p>
                            <p className="text-sm text-slate-400">{new Date(trade.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-slate-400 text-sm">Entry: ${trade.entry_price}</p>
                            <Badge variant="secondary" className="text-xs">OPEN</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleClosePosition(trade)}
                              className="bg-amber-600 hover:bg-amber-700 text-xs"
                              disabled={closingPosition}
                            >
                              Close
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="text-xs"
                              disabled={deletingTrade}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Trade History */}
          {closedTrades.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-100">Trade History ({closedTrades.length})</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={sortBy === 'timestamp' ? 'default' : 'outline'}
                    onClick={() => setSortBy('timestamp')}
                  >
                    By Date
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === 'pnl' ? 'default' : 'outline'}
                    onClick={() => setSortBy('pnl')}
                  >
                    By P&L
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Timestamp</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Amount (BTC)</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Entry</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Exit</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">P&L</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTrades
                      .filter((t) => t.status === 'closed')
                      .map((trade) => (
                        <tr key={trade.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-slate-300">{new Date(trade.timestamp).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                trade.action === 'BUY'
                                  ? 'success'
                                  : trade.action === 'SELL'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {trade.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">{trade.amount}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">${trade.entry_price}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            ${trade.exit_price || 'N/A'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold font-mono flex items-center justify-end gap-1 ${
                              trade.pnl && trade.pnl > 0
                                ? 'text-green-400'
                                : trade.pnl && trade.pnl < 0
                                ? 'text-red-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {trade.pnl && trade.pnl > 0 && <TrendingUp className="h-4 w-4" />}
                            {trade.pnl && trade.pnl < 0 && <TrendingDown className="h-4 w-4" />}
                            ${Math.abs(trade.pnl || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTrade(trade)}
                                className="h-6 w-6 p-0"
                                disabled={updatingTrade}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTrade(trade.id)}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                disabled={deletingTrade}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {trades.length === 0 && (
            <EmptyState message="No trades available. Start trading to see history here." />
          )}
        </>
      )}
    </div>
  );
}
