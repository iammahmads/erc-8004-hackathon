'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeExecution } from '@/lib/hooks-web3';
import { getSepoliaExplorerUrl } from '@/lib/web3';
import { AlertCircle, CheckCircle, Loader, Copy, ExternalLink } from 'lucide-react';

interface TradeExecutionModalProps {
  trade: {
    action: 'BUY' | 'SELL';
    amount: number;
    entryPrice: number;
    exitPrice: number;
    pair?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

export function TradeExecutionModal({
  trade,
  isOpen,
  onClose,
  onSuccess,
}: TradeExecutionModalProps) {
  const { executeTrade, loading, error, txHash, step, reset } = useTradeExecution();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSign = async () => {
    const result = await executeTrade(trade);
    if (result.success && result.txHash) {
      onSuccess?.(result.txHash);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCopyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate potential P&L
  const pnl = (trade.exitPrice - trade.entryPrice) * trade.amount;
  const pnlPercent = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;

  const stepStatuses = [
    {
      title: 'Sign Trade Intent',
      description: 'You authorize this trade with your wallet',
      icon: '📝',
    },
    {
      title: 'Submit to Risk Router',
      description: 'Contract validates position limits',
      icon: '🚀',
    },
    {
      title: 'Post Artifact',
      description: 'Record proof on Validation Registry',
      icon: '📋',
    },
    {
      title: 'Complete',
      description: 'Trade recorded and verified on-chain',
      icon: '🎉',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            {step === 4 ? '✅' : '🔐'} Execute Trade On-Chain
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Sign and submit your trade to the ERC-8004 Risk Router
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Trade Details Card */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Action</p>
                <p className={`text-lg font-bold ${trade.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.action}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Amount</p>
                <p className="text-lg font-bold text-blue-300">
                  {trade.amount} {trade.pair?.split('/')[0] || 'BTC'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Entry Price</p>
                <p className="text-lg font-bold">${trade.entryPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Exit Price</p>
                <p className="text-lg font-bold">${trade.exitPrice.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400">Potential P&L</p>
                <p className={`text-lg font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${pnl.toFixed(2)} ({pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>

          {/* Execution Steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Execution Steps</p>
            {stepStatuses.map((stepInfo, index) => {
              const isActive = step === index;
              const isComplete = step > index;
              const isCurrent = step === index && loading;

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isComplete
                      ? 'bg-green-500/10 border-green-500/30'
                      : isActive
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-700/30 border-slate-600'
                  }`}
                >
                  <div className="mt-1">
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : isCurrent ? (
                      <Loader className="h-5 w-5 text-blue-400 animate-spin" />
                    ) : (
                      <span className="text-lg">{stepInfo.icon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stepInfo.title}</p>
                    <p className="text-xs text-slate-400">{stepInfo.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/20 rounded-lg border border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-100">Transaction Failed</p>
                <p className="text-xs text-red-200 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Transaction Hash</p>
              <div className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-600">
                <span className="text-xs text-slate-300 font-mono flex-1 truncate">{txHash}</span>
                <button
                  onClick={handleCopyTxHash}
                  className="p-2 hover:bg-slate-700 rounded transition-colors"
                  title="Copy"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                <a
                  href={getSepoliaExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-slate-700 rounded transition-colors text-blue-400"
                  title="View on Sepolia"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                🔗 View on{' '}
                <a
                  href={getSepoliaExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sepolia Etherscan
                </a>
              </p>
            </div>
          )}

          {/* Warning */}
          {step === 0 && !error && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-100">
                <p className="font-medium">Confirm before signing</p>
                <p className="text-xs mt-1">You will be asked to sign this transaction in MetaMask.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {step === 0 ? (
              <>
                <Button
                  onClick={handleSign}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>🔐 Sign & Execute Trade</>
                  )}
                </Button>
                <Button onClick={handleClose} variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </>
            ) : step === 4 ? (
              <Button onClick={handleClose} className="w-full">
                ✅ Close
              </Button>
            ) : (
              <Button disabled className="w-full">
                ⏳ Processing... Please wait
              </Button>
            )}
          </div>

          {/* Info Footer */}
          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-700">
            <p>💡 Network: Sepolia Testnet (Chain ID: 11155111)</p>
            <p>📝 Your trade will be recorded on-chain permanently</p>
            <p>⭐ Validators will score your risk compliance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
