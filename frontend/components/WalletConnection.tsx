'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { connectWallet, getCurrentAddress, formatTxHash, getSepoliaAddressUrl } from '@/lib/web3';
import { Copy, ExternalLink, Loader } from 'lucide-react';

export function WalletConnection() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const addr = await getCurrentAddress();
        if (addr) {
          setAddress(addr);
        }
      } catch (err) {
        console.log('No wallet connected');
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    setError(null);
  };

  if (!address) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>🦊 Connect Wallet</>
          )}
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Connected Wallet</p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <a
              href={getSepoliaAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-400 hover:text-blue-300 break-all"
            >
              {formatTxHash(address)}
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-1">Sepolia Testnet (Chain ID: 11155111)</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyAddress}
            className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
            title="Copy address"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <a
            href={getSepoliaAddressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-blue-400"
            title="View on Etherscan"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for CheckCircle since we imported from lucide
import { CheckCircle } from 'lucide-react';
