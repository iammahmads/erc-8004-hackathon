'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, LogOut } from 'lucide-react';

interface ClosePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exitPrice: number) => Promise<void>;
  loading?: boolean;
  error?: string;
  currentPrice?: number;
}

export function ClosePositionModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = '',
  currentPrice = 0,
}: ClosePositionModalProps) {
  const [exitPrice, setExitPrice] = useState(currentPrice.toString());
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess(false);

    if (!exitPrice || parseFloat(exitPrice) <= 0) {
      setSubmitError('Exit Price must be positive');
      return;
    }

    try {
      await onSubmit(parseFloat(exitPrice));
      setSuccess(true);

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setExitPrice(currentPrice.toString());
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to close position');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Close Position
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Exit Price */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Exit Price ($)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder={currentPrice.toString()}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            {currentPrice > 0 && (
              <p className="mt-1 text-xs text-slate-400">Current market price: ${currentPrice}</p>
            )}
          </div>

          {/* Error Messages */}
          {(submitError || error) && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/50 text-red-300 text-sm">
              {submitError || error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/50 text-green-300 text-sm">
              ✓ Position closed successfully!
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
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Closing...' : 'Close Position'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
