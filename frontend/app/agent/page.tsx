'use client';

import { useState, useEffect } from 'react';
import { useReputation, useArtifacts, useRegisterAgent } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/loading';
import { Copy, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Download, Trophy, Shield, TrendingUp } from 'lucide-react';

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0x0740DeB986e2C7B7D4b4F3Aa4C2875a411380485';
const SEPOLIA_EXPLORER = process.env.NEXT_PUBLIC_SEPOLIA_EXPLORER || 'https://sepolia.etherscan.io';
const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || '0x1234567890123456789012345678901234567890';

interface NFTDetails {
  nft_id: string;
  tx_hash: string;
  mint_date: string;
  contract_address: string;
  token_uri?: string;
  metadata?: {
    name: string;
    description: string;
    image?: string;
  };
}

export default function AgentProfile() {
  const { data: reputation, loading: repLoading, error: repError, refetch: refetchRep } = useReputation(AGENT_ADDRESS);
  const { data: artifacts, loading: artLoading, error: artError, refetch: refetchArt } = useArtifacts(AGENT_ADDRESS);
  const { mutate: registerAgent, loading: regLoading, error: regError } = useRegisterAgent();
  const [copied, setCopied] = useState(false);
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<{ nft_id: string; tx_hash: string } | null>(null);
  const [registerErrorMsg, setRegisterErrorMsg] = useState<string | null>(null);

  // Load NFT details from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`agent_nft_${AGENT_ADDRESS}`);
    if (saved) {
      try {
        setNftDetails(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved NFT details');
      }
    }
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(AGENT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterAgent = async () => {
    try {
      setRegisterErrorMsg(null);
      const result = await registerAgent(undefined);
      setRegisterSuccess(result as { nft_id: string; tx_hash: string });
      
      // Save NFT details to localStorage
      const nftData: NFTDetails = {
        nft_id: result.nft_id,
        tx_hash: result.tx_hash,
        mint_date: new Date().toISOString(),
        contract_address: NFT_CONTRACT,
        metadata: {
          name: `Agent #${result.nft_id}`,
          description: 'On-chain trading agent with compliance verification',
        },
      };
      setNftDetails(nftData);
      localStorage.setItem(`agent_nft_${AGENT_ADDRESS}`, JSON.stringify(nftData));
      
      // Refetch reputation after registration
      setTimeout(() => refetchRep(), 2000);
    } catch (err) {
      setRegisterErrorMsg(err instanceof Error ? err.message : 'Failed to register agent');
    }
  };

  const handleDownloadMetadata = () => {
    if (!nftDetails) return;
    const metadata = {
      agent_address: AGENT_ADDRESS,
      nft_id: nftDetails.nft_id,
      tx_hash: nftDetails.tx_hash,
      mint_date: nftDetails.mint_date,
      contract_address: nftDetails.contract_address,
      reputation: reputation,
      artifacts_count: artifacts?.length || 0,
      exported_at: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent_nft_${nftDetails.nft_id}_metadata.json`;
    link.click();
  };

  const handleRefresh = async () => {
    await refetchRep();
    await refetchArt();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Agent Profile</h1>
          <p className="mt-1 text-slate-400">On-chain identity and reputation</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Agent Card */}
      <Card>
        <CardHeader>
          <CardTitle>NFT Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registerErrorMsg && (
              <div className="p-4 rounded-lg bg-red-900/10 border border-red-800/30">
                <p className="text-sm text-red-300 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {registerErrorMsg}
                </p>
              </div>
            )}

            {registerSuccess && (
              <div className="p-4 rounded-lg bg-green-900/10 border border-green-800/30">
                <p className="text-sm text-green-300 flex gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  Agent registered successfully!
                </p>
                <p className="text-xs text-green-300">NFT ID: {registerSuccess.nft_id}</p>
                <a
                  href={`${SEPOLIA_EXPLORER}/tx/${registerSuccess.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 mt-2"
                >
                  View Transaction <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Agent Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 block p-3 rounded bg-slate-700/50 font-mono text-sm text-slate-200 break-all">
                  {AGENT_ADDRESS}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyAddress}
                  title={copied ? 'Copied!' : 'Copy address'}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">NFT ID</p>
                <p className="text-lg font-bold text-slate-100">{nftDetails?.nft_id || reputation?.nft_id || 'Pending'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Mint Date</p>
                <p className="text-sm font-semibold text-slate-100">
                  {nftDetails?.mint_date 
                    ? new Date(nftDetails.mint_date).toLocaleDateString()
                    : reputation?.mint_date || 'Not minted'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Contract</p>
                <p className="text-xs font-mono text-slate-300">{nftDetails?.contract_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Status</p>
                <Badge variant={nftDetails || reputation?.nft_id ? 'success' : 'secondary'}>
                  {nftDetails || reputation?.nft_id ? 'Minted ✓' : 'Not Minted'}
                </Badge>
              </div>
            </div>

            {!reputation?.nft_id && !nftDetails && (
              <Button 
                onClick={handleRegisterAgent}
                disabled={regLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {regLoading ? 'Registering...' : 'Register Agent NFT'}
              </Button>
            )}

            {(nftDetails || registerSuccess) && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col gap-2">
                  <a
                    href={`${SEPOLIA_EXPLORER}/tx/${nftDetails?.tx_hash || registerSuccess?.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-900/20 border border-blue-600/50 text-blue-400 hover:bg-blue-900/40 text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Mint Transaction
                  </a>
                  <button
                    onClick={handleDownloadMetadata}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-900/20 border border-green-600/50 text-green-400 hover:bg-green-900/40 text-sm font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Metadata
                  </button>
                </div>
              </div>
            )}

            <div>
              <a
                href={`${SEPOLIA_EXPLORER}/address/${AGENT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                View on Sepolia Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reputation Stats */}
      {repLoading ? (
        <LoadingState message="Loading reputation..." />
      ) : repError ? (
        <ErrorState message={repError} />
      ) : reputation ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compliant Trades</p>
                    <p className="mt-2 text-2xl font-bold text-green-400">{reputation.compliant_trades}</p>
                  </div>
                  <Shield className="h-5 w-5 text-green-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Trades</p>
                    <p className="mt-2 text-2xl font-bold text-slate-100">{reputation.total_trades}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compliance Rate</p>
                    <p className="mt-2 text-2xl font-bold text-blue-400">
                      {reputation.total_trades > 0
                        ? ((reputation.compliant_trades / reputation.total_trades) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <Trophy className="h-5 w-5 text-yellow-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Score Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Agent Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-300">Onchain Reputation</span>
                  <span className="text-sm font-bold text-green-400">{reputation.reputation_score || 0}/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${((reputation.reputation_score || 0) / 100) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Compliant Rate</p>
                  <p className="text-lg font-bold text-green-400">
                    {reputation.total_trades > 0
                      ? ((reputation.compliant_trades / reputation.total_trades) * 100).toFixed(0)
                      : 0}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Trade Volume</p>
                  <p className="text-lg font-bold text-blue-400">{reputation.total_trades}</p>
                </div>
              </div>

              {nftDetails && (
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">NFT Status</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">
                      <span className="text-slate-400">ID:</span>{' '}
                      <span className="font-mono text-green-400">#{nftDetails.nft_id}</span>
                    </p>
                    <p className="text-xs text-slate-300">
                      <span className="text-slate-400">Minted:</span>{' '}
                      <span className="text-slate-200">{new Date(nftDetails.mint_date).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* NFT Metadata Details */}
      {nftDetails && (
        <Card className="border-emerald-600/30 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎖️ NFT Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Name</p>
                <p className="text-sm font-semibold text-slate-100">{nftDetails.metadata?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Type</p>
                <p className="text-sm font-semibold text-slate-100">Agent Identity NFT (ERC-8004)</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-300">{nftDetails.metadata?.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Transaction Hash</p>
                  <a
                    href={`${SEPOLIA_EXPLORER}/tx/${nftDetails.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 break-all flex items-center gap-1"
                  >
                    {nftDetails.tx_hash.slice(0, 20)}...
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Contract Address</p>
                  <a
                    href={`${SEPOLIA_EXPLORER}/address/${nftDetails.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 break-all flex items-center gap-1"
                  >
                    {nftDetails.contract_address.slice(0, 20)}...
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Token ID</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">#{nftDetails.nft_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Minted At</p>
                  <p className="text-sm text-slate-200">{new Date(nftDetails.mint_date).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleDownloadMetadata}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Full Metadata
              </Button>
              <a
                href={`${SEPOLIA_EXPLORER}/token/erc721/${nftDetails.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View on Sepolia
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* On-Chain Artifacts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Trade Artifacts</h2>
            <p className="text-xs text-slate-400 mt-1">Off-chain proof of all trades executed by this agent</p>
          </div>
          {artifacts && artifacts.length > 0 && (
            <Badge variant="secondary">{artifacts.length} Artifacts</Badge>
          )}
        </div>

        {artLoading ? (
          <LoadingState message="Loading artifacts..." />
        ) : artError ? (
          <ErrorState message={artError} />
        ) : artifacts && artifacts.length > 0 ? (
          <div className="space-y-3">
            {artifacts.slice(0, 10).map((artifact) => (
              <Card key={artifact.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={artifact.compliant ? 'success' : 'destructive'}>
                          {artifact.compliant ? 'Compliant' : 'Non-Compliant'}
                        </Badge>
                        <span className="text-xs text-slate-500">{artifact.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Action</p>
                          <p className="font-semibold text-slate-100">{artifact.action}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Amount</p>
                          <p className="font-semibold text-slate-100">{artifact.amount} BTC</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Block</p>
                          <p className="font-mono text-slate-200">{artifact.block_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Tx Hash</p>
                          <a
                            href={`${SEPOLIA_EXPLORER}/tx/${artifact.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-400 hover:text-blue-300 truncate"
                          >
                            {artifact.txId.slice(0, 8)}...
                          </a>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${artifact.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <ExternalLink className="h-5 w-5 text-slate-500 hover:text-blue-400" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState message="No artifacts posted yet" />
        )}
      </div>
    </div>
  );
}
