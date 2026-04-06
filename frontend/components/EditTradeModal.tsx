'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Edit2 } from 'lucide-react';
import * as T from '@/lib/types';

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trade: Partial<T.Trade>) => Promise<void>;
  trade?: T.Trade | null;
  loading?: boolean;
  error?: string;
}

export function EditTradeModal({
  isOpen,
  onClose,
  onSubmit,
  trade,
  loading = false,
  error = '',
}: EditTradeModalProps) {
  const [action, setAction] = useState(trade?.action || 'BUY');
  const [amount, setAmount] = useState((trade?.amount || 0).toString());
  const [entryPrice, setEntryPrice] = useState((trade?.entry_price || 0).toString());
  const [exitPrice, setExitPrice] = useState((trade?.exit_price || 0).toString());
  const [status, setStatus] = useState(trade?.status || 'open');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !trade) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);

    // Validation
    if (!amount || !entryPrice) {
      setSubmitError('Amount and Entry Price are required');
      return;
    }

    if (parseFloat(amount) <= 0 || parseFloat(entryPrice) <= 0) {
      setSubmitError('Amount and Entry Price must be positive');
      return;
    }

    if (status === 'closed' && !exitPrice) {
      setSubmitError('Exit Price is required for closed trades');
      return;
    }

    if (exitPrice && parseFloat(exitPrice) < 0) {
      setSubmitError('Exit Price must be positive');
      return;
    }

    try {
      const updates: Partial<T.Trade> = {
        action: action as "BUY" | "SELL",
        amount: parseFloat(amount),
        entry_price: parseFloat(entryPrice),
        exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
        status: status as "open" | "closed",
      };

      // Calculate P&L if closed
      if (status === 'closed' && exitPrice) {
        const entryValue = parseFloat(amount) * parseFloat(entryPrice);
        const exitValue = parseFloat(amount) * parseFloat(exitPrice);
        updates.pnl = action === 'BUY' ? exitValue - entryValue : entryValue - exitValue;
      } else {
        updates.pnl = 0;
      }

      await onSubmit(updates);
      setSuccess(true);

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update trade');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Trade
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Action</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAction('BUY')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                  action === 'BUY'
                    ? 'bg-green-900/50 text-green-300 border border-green-600'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setAction('SELL')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                  action === 'SELL'
                    ? 'bg-red-900/50 text-red-300 border border-red-600'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Amount (BTC)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Entry Price ($)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus('open');
                  setExitPrice('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  status === 'open'
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-600'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                OPEN
              </button>
              <button
                type="button"
                onClick={() => setStatus('closed')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  status === 'closed'
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-600'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                CLOSED
              </button>
            </div>
          </div>

          {/* Exit Price (conditional) */}
          {status === 'closed' && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Exit Price ($)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Error Messages */}
          {(submitError || error) && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/50 text-red-300 text-sm">
              {submitError || error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/50 text-green-300 text-sm">
              ✓ Trade updated successfully!
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Trade'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
