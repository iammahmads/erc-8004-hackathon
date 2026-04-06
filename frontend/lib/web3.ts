import { ethers } from 'ethers';

// Extend Window interface for MetaMask injection
declare global {
  interface Window {
    ethereum?: any;
  }
}

const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.drpc.org';
const RISK_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_RISK_ROUTER;
const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY;

/**
 * Get the ethers.js provider connected to user's wallet
 */
export async function getProvider() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get the signer (user's account)
 */
export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

/**
 * Connect wallet and return user's address
 */
export async function connectWallet(): Promise<string> {
  try {
    const provider = await getProvider();
    const accounts = await provider.send('eth_requestAccounts', []);
    
    // Switch to Sepolia if not already
    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]);
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            rpcUrls: ['https://sepolia.drpc.org'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ]);
      }
    }
    
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection failed:', error);
    throw error;
  }
}

/**
 * Sign trade intent using EIP-712
 * This proves user authorized this specific trade without on-chain cost
 */
export async function signTradeIntent(
  action: 'BUY' | 'SELL',
  amount: number,
  entryPrice: number,
  exitPrice: number,
  pair: string = 'BTC/USD',
  timestamp: number = Math.floor(Date.now() / 1000)
) {
  const signer = await getSigner();
  const signerAddress = await signer.getAddress();

  // EIP-712 Domain separator
  // Must match the contract's domain
  const domain = {
    name: 'MacroSentryAgent',
    version: '1',
    chainId: 11155111, // Sepolia
    verifyingContract: RISK_ROUTER_ADDRESS || ethers.getAddress('0x0000000000000000000000000000000000000000'),
  };

  // Define the TradeIntent type structure
  const types = {
    TradeIntent: [
      { name: 'agent', type: 'address' },
      { name: 'action', type: 'string' }, // 'BUY' or 'SELL'
      { name: 'asset', type: 'string' }, // 'BTC', 'ETH', etc
      { name: 'amount', type: 'uint256' }, // in wei (10^18)
      { name: 'entryPrice', type: 'uint256' }, // in wei
      { name: 'exitPrice', type: 'uint256' }, // in wei
      { name: 'timestamp', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  // The actual message values
  const message = {
    agent: signerAddress,
    action,
    asset: pair.split('/')[0], // 'BTC' from 'BTC/USD'
    amount: ethers.parseEther(amount.toString()),
    entryPrice: ethers.parseEther(entryPrice.toString()),
    exitPrice: ethers.parseEther(exitPrice.toString()),
    timestamp,
    nonce: Math.floor(Date.now() / 1000),
  };

  // Sign the structured data
  const signature = await signer.signTypedData(domain, types, message);

  return {
    domain,
    types,
    message,
    signature,
    signerAddress,
  };
}

/**
 * Post trade artifact on Validation Registry
 * Proves the trade happened and was validated
 */
export async function postTradeArtifact(
  txHash: string,
  action: string,
  amount: string,
  isCompliant: boolean,
  reasoningHash: string
): Promise<any> {
  const signer = await getSigner();

  // Minimal ABI for posting artifacts
  const abi = [
    'function postArtifact(bytes32 txHash, string action, uint256 amount, bool compliant, bytes32 reasoning) external returns (bytes32)',
  ];

  if (!AGENT_REGISTRY_ADDRESS) {
    throw new Error('AGENT_REGISTRY_ADDRESS not configured');
  }

  const contract = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    abi,
    signer
  );

  const tx = await contract.postArtifact(
    txHash,
    action,
    ethers.parseEther(amount),
    isCompliant,
    reasoningHash
  );

  // Wait for confirmation
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Get agent reputation score
 * Higher = more trusted by validators
 */
export async function getAgentReputation(agentAddress: string): Promise<number> {
  if (!AGENT_REGISTRY_ADDRESS) {
    throw new Error('AGENT_REGISTRY_ADDRESS not configured');
  }

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

  const abi = [
    'function getReputation(address agent) external view returns (uint256)',
  ];

  const contract = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    abi,
    provider
  );

  const reputation = await contract.getReputation(agentAddress);
  return Number(reputation);
}

/**
 * Get all trade artifacts posted by agent
 * Shows proof of all executed trades
 */
export async function getAgentArtifacts(agentAddress: string): Promise<any[]> {
  if (!AGENT_REGISTRY_ADDRESS) {
    throw new Error('AGENT_REGISTRY_ADDRESS not configured');
  }

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

  const abi = [
    'function getArtifacts(address agent) external view returns (tuple(bytes32 txHash, string action, uint256 amount, bool compliant, uint256 timestamp)[])',
  ];

  const contract = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    abi,
    provider
  );

  const artifacts = await contract.getArtifacts(agentAddress);
  return artifacts;
}

/**
 * Check if address is registered as agent
 */
export async function isAgentRegistered(agentAddress: string): Promise<boolean> {
  if (!AGENT_REGISTRY_ADDRESS) {
    throw new Error('AGENT_REGISTRY_ADDRESS not configured');
  }

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

  const abi = [
    'function isRegistered(address agent) external view returns (bool)',
  ];

  const contract = new ethers.Contract(
    AGENT_REGISTRY_ADDRESS,
    abi,
    provider
  );

  return await contract.isRegistered(agentAddress);
}

/**
 * Get current connected wallet address
 */
export async function getCurrentAddress(): Promise<string | null> {
  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch {
    return null;
  }
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get Sepolia Etherscan URL for tx
 */
export function getSepoliaExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Get Sepolia Etherscan URL for address
 */
export function getSepoliaAddressUrl(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}
