import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount, useActiveWallet, useActiveWalletChain} from 'thirdweb/react';
import { PRICE_ABI } from '../lib/ABI/PriceAPI_ABI.ts';
import { Token_ABI} from '../lib/ABI/TestToken_ABI.ts';
import { SWAP_ABI } from '../lib/ABI/Swap_ABI.ts';
import { AfriStable_ABI } from '@/lib/ABI/AfriStable_ABI.ts';
import {Saving_ABI} from '@/lib/ABI/Saving_ABI.ts'
import tokens from '@/lib/Tokens/tokens.ts';

// Import or define the Token type
import type { Token } from '@/lib/Tokens/tokens.ts';

// Contract addresses - replace with your actual contract addresses
export const CONTRACT_ADDRESSES = {
  swapAddress: '0x013b0CA4E4559339F43682B7ac05479eD48E694f',
  priceFeedAddress: '0x6a257B0a406eB762C105130314dB15B1a29AbC4e',
  afriStableAddress: '0x6615c93A524E2B2daa36276Ac418D3cB60d2DC60',
  savingAddress: '0x1CC25BCD029E6E0Bf9767216A885A29Eb79f93f0'
};

// Morph Holesky chain ID
const MORPH_CHAIN_ID = 2810;

// Thirdweb RPC endpoint
const THIRDWEB_RPC_URL = `https://rpc-quicknode-holesky.morphl2.io`;

// Enhanced context interface with Thirdweb integration
interface ContractInstancesContextType {
  fetchBalance: (faucetAddress: string) => Promise<string | undefined>;
  SWAP_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  AFRISTABLE_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  TEST_TOKEN_CONTRACT_INSTANCE: (tokenAddress: string) => Promise<ethers.Contract | null>;
  PRICEAPI_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  SAVING_CONTRACT_INSTANCE: () => Promise<ethers.Contract | null>;
  signer: ethers.Signer | null;
  provider: ethers.JsonRpcProvider | null;
  address: string | null;
  nativeBalance: string | null;
  tokenList: Token[];
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkError: string | null;
  connectionError: string | null;
  // Manual connection method
  reconnectSigner: () => Promise<void>;
  // Network switching method
  switchToMorphNetwork: () => Promise<boolean>;
}

export const ContractInstances = createContext<ContractInstancesContextType | undefined>(undefined);

interface ContractInstanceProviderProps {
  children: ReactNode;
}

// Provider component with updated Thirdweb integration
export const ContractInstanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Thirdweb hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();

  // Local state
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Derived state
  const address = account?.address || null;
  const isConnected = !!account && !!wallet;
  const isCorrectNetwork = activeChain?.id === MORPH_CHAIN_ID;

  // Network switching function
  const switchToMorphNetwork = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error('Ethereum provider not available');
      }

      console.log('Attempting to switch to Morph Holesky network...');
      
      // First, try to switch to the existing network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${MORPH_CHAIN_ID.toString(16)}` }], // Convert 2810 to hex: 0xAFA
        });
        console.log('✅ Successfully switched to Morph Holesky network');
        return true;
      } catch (switchError: any) {
        // If network doesn't exist (error code 4902), add it
        if (switchError.code === 4902) {
          console.log('Morph Holesky network not found, adding it...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${MORPH_CHAIN_ID.toString(16)}`, // 0xAFA
                chainName: 'Morph Holesky',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [THIRDWEB_RPC_URL],
                blockExplorerUrls: ['https://explorer-testnet.morphl2.io/'],
              },
            ],
          });
          console.log('✅ Successfully added and switched to Morph Holesky network');
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('❌ Failed to switch network:', error);
      return false;
    }
  };

  // Initialize provider with Thirdweb RPC
  useEffect(() => {
    const initializeProvider = () => {
      try {
        const jsonRpcProvider = new ethers.JsonRpcProvider(THIRDWEB_RPC_URL);
        setProvider(jsonRpcProvider);
        console.log('Thirdweb RPC provider initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Thirdweb RPC provider:', error);
        setConnectionError('Failed to initialize RPC provider');
      }
    };

    initializeProvider();
  }, []);

  // Effect to create signer from active account with Thirdweb RPC
  useEffect(() => {
    const createSignerFromAccount = async () => {
      if (account && wallet && isConnected && isCorrectNetwork && provider) {
        try {
          console.log('Starting signer creation process...');
          console.log('Account:', account.address);
          console.log('Wallet:', wallet);
          console.log('Provider available:', !!provider);

          // Check if the browser has ethereum provider for signing
          if (typeof window !== 'undefined' && window.ethereum) {
            console.log('Ethereum provider found, creating browser provider...');
            
            // Create browser provider for signing transactions
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            console.log('Browser provider created successfully');
            
            // Get the signer
            console.log('Getting signer from browser provider...');
            const ethSigner = await browserProvider.getSigner();
            console.log('Signer obtained from browser provider');
            
            // Verify the signer address matches the account
            const signerAddress = await ethSigner.getAddress();
            console.log('Signer address:', signerAddress);
            console.log('Account address:', account.address);
            
            if (signerAddress.toLowerCase() === account.address.toLowerCase()) {
              // Try to connect signer to our Thirdweb RPC provider
              try {
                console.log('Connecting signer to Thirdweb RPC provider...');
                const connectedSigner = ethSigner.connect(provider);
                setSigner(connectedSigner);
                setConnectionError(null);
                console.log('✅ Signer connected with Thirdweb RPC provider successfully');
              } catch (connectError) {
                console.warn('Failed to connect signer to Thirdweb RPC, using browser signer:', connectError);
                // Fallback: use the browser signer directly
                setSigner(ethSigner);
                setConnectionError(null);
                console.log('✅ Using browser signer as fallback');
              }
            } else {
              console.warn('❌ Signer address mismatch with account');
              console.warn('Expected:', account.address.toLowerCase());
              console.warn('Got:', signerAddress.toLowerCase());
              setSigner(null);
              setConnectionError('Address mismatch between wallet and signer');
            }
          } else {
            console.warn('❌ No ethereum provider found in window object');
            console.log('Available providers:', Object.keys(window).filter(key => key.includes('ethereum') || key.includes('wallet')));
            setSigner(null);
            setConnectionError('No ethereum provider available');
          }
        } catch (error) {
          console.error('❌ Failed to create signer from account:', error);
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          setSigner(null);
          setConnectionError(`Failed to create signer: ${error.message}`);
        }
      } else {
        console.log('Signer creation conditions not met:');
        console.log('- Account:', !!account);
        console.log('- Wallet:', !!wallet);
        console.log('- Is Connected:', isConnected);
        console.log('- Is Correct Network:', isCorrectNetwork);
        console.log('- Provider:', !!provider);
        setSigner(null);
      }
    };

    createSignerFromAccount();
  }, [account, wallet, isConnected, isCorrectNetwork, provider]);

  // Alternative signer creation method for Thirdweb compatibility
  useEffect(() => {
    const createThirdwebCompatibleSigner = async () => {
      if (account && wallet && isConnected && isCorrectNetwork) {
        try {
          console.log('Attempting Thirdweb-compatible signer creation...');
          
          // Method 1: Try to get signer from wallet adapter
          if (wallet.getChain && wallet.switchChain) {
            try {
              // Ensure we're on the correct chain
              const currentChain = await wallet.getChain();
              if (currentChain.id !== MORPH_CHAIN_ID) {
                console.log('Switching to correct chain...');
                await wallet.switchChain({
                  id: MORPH_CHAIN_ID,
                  name: "Morph Holesky",
                  rpc: THIRDWEB_RPC_URL,
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18
                  }
                });
              }
            } catch (chainError) {
              console.warn('Chain switch failed:', chainError);
            }
          }

          // Method 2: Try EIP-1193 provider approach
          if (typeof window !== 'undefined' && window.ethereum) {
            console.log('Trying EIP-1193 provider approach...');
            
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create provider and signer
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await web3Provider.getSigner();
            
            // Verify network
            const network = await web3Provider.getNetwork();
            console.log('Current network:', network.chainId);
            
            if (Number(network.chainId) === MORPH_CHAIN_ID) {
              setSigner(signer);
              setConnectionError(null);
              console.log('✅ EIP-1193 signer created successfully');
              return;
            } else {
              console.warn('Wrong network detected:', network.chainId, 'expected:', MORPH_CHAIN_ID);
              setNetworkError(`Wrong network. Expected chain ID: ${MORPH_CHAIN_ID}, got: ${network.chainId}`);
            }
          }

          // Method 3: Direct provider connection (fallback)
          if (provider) {
            console.log('Using read-only provider as fallback...');
            // This won't allow transactions but will allow contract reads
            setConnectionError('Connected in read-only mode. Some features may be limited.');
          }

        } catch (error) {
          console.error('All signer creation methods failed:', error);
          setConnectionError(`Signer creation failed: ${error.message}`);
        }
      }
    };

    // Run alternative method if primary method fails
    if (isConnected && !signer && !connectionError?.includes('No ethereum provider')) {
      createThirdwebCompatibleSigner();
    }
  }, [account, wallet, isConnected, isCorrectNetwork, provider, signer, connectionError]);

  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (provider && address && isConnected && isCorrectNetwork) {
        try {
          const balance = await provider.getBalance(address);
          setNativeBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Failed to fetch native balance:', error);
          setNativeBalance('0');
        }
      } else {
        setNativeBalance('0');
      }
    };

    fetchNativeBalance();
  }, [provider, address, isConnected, isCorrectNetwork]);

  // Enhanced effect to handle network changes with automatic switching
  useEffect(() => {
    const handleNetworkChange = async () => {
      if (isConnected && activeChain?.id && activeChain.id !== MORPH_CHAIN_ID) {
        console.log(`Wrong network detected: ${activeChain.id}, expected: ${MORPH_CHAIN_ID}`);
        
        // Show network error immediately
        setNetworkError(`Connected to wrong network. Please switch to Morph Holesky (Chain ID: ${MORPH_CHAIN_ID}) or click the switch button.`);
        
        // Optionally try to switch automatically (uncomment if you want auto-switch)
        // const switched = await switchToMorphNetwork();
        // if (switched) {
        //   setNetworkError(null);
        // }
      } else if (isConnected && isCorrectNetwork) {
        setNetworkError(null);
      }
    };

    handleNetworkChange();
  }, [activeChain?.id, isConnected, isCorrectNetwork]);

  // Effect to clear state when disconnected
  useEffect(() => {
    if (!isConnected) {
      setConnectionError(null);
      setNetworkError(null);
      setSigner(null);
      setNativeBalance('0');
    }
  }, [isConnected]);

  // Fetch balance function
  const fetchBalance = async (faucetAddress: string): Promise<string | undefined> => {
    try {
      if (!address || !isConnected || !isCorrectNetwork || !provider) {
        throw new Error('Wallet not connected, wrong network, or provider not available');
      }

      const token = tokens.find(token => token.address === faucetAddress);
      if (!token) {
        throw new Error('Token not found');
      }

      // Check if it's the native token
      if (token.symbol === 'ETH') {
        return nativeBalance || '0';
      }

      // Special case for AFX token
      if (token.symbol === 'AFX') {
        const AFRI_CONTRACT = await AFRISTABLE_CONTRACT_INSTANCE();
        if (!AFRI_CONTRACT) {
          throw new Error('Unable to create AFX token contract instance');
        }
        const balance = await AFRI_CONTRACT.balanceOf(address);
        const formattedBalance = ethers.formatEther(balance);
        return formattedBalance;
      }

      // For other ERC20 tokens
      const TOKEN_CONTRACT = await TEST_TOKEN_CONTRACT_INSTANCE(faucetAddress);
      if (!TOKEN_CONTRACT) {
        throw new Error('Unable to create token contract instance');
      }
      const balance = await TOKEN_CONTRACT.balanceOf(address);
      const formattedBalance = ethers.formatEther(balance);
      return formattedBalance;

    } catch (error) {
      console.error('Error fetching balance:', error);
      return undefined;
    }
  };

  // Contract instance functions with Thirdweb RPC provider
  const SWAP_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      console.warn('Provider not available, wallet not connected, or wrong network.');
      return null;
    }
    
    // Use signer if available for write operations, otherwise use provider for read-only
    const signerOrProvider = signer || provider;
    return new ethers.Contract(CONTRACT_ADDRESSES.swapAddress, SWAP_ABI, signerOrProvider);
  };

  const PRICEAPI_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      console.warn('Provider not available, wallet not connected, or wrong network.');
      return null;
    }
    
    const signerOrProvider = signer || provider;
    return new ethers.Contract(CONTRACT_ADDRESSES.priceFeedAddress, PRICE_ABI, signerOrProvider);
  };

  const TEST_TOKEN_CONTRACT_INSTANCE = async (TOKEN_ADDRESS: string): Promise<ethers.Contract | null> => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      console.warn('Provider not available, wallet not connected, or wrong network.');
      return null;
    }
    
    const signerOrProvider = signer || provider;
    return new ethers.Contract(TOKEN_ADDRESS, Token_ABI, signerOrProvider);
  };

  const AFRISTABLE_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      console.warn('Provider not available, wallet not connected, or wrong network.');
      return null;
    }
    
    const signerOrProvider = signer || provider;
    return new ethers.Contract(CONTRACT_ADDRESSES.afriStableAddress, AfriStable_ABI, signerOrProvider);
  };

  const SAVING_CONTRACT_INSTANCE = async (): Promise<ethers.Contract | null> => {
    if (!provider || !isConnected || !isCorrectNetwork) {
      console.warn('Provider not available, wallet not connected, or wrong network.');
      return null;
    }
    
    const signerOrProvider = signer || provider;
    return new ethers.Contract(CONTRACT_ADDRESSES.savingAddress, Saving_ABI, signerOrProvider);
  };

  // Manual reconnection function
  const reconnectSigner = async (): Promise<void> => {
    try {
      console.log('Manual signer reconnection initiated...');
      setConnectionError(null);
      
      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      if (!isCorrectNetwork) {
        throw new Error(`Wrong network. Please switch to chain ID: ${MORPH_CHAIN_ID}`);
      }

      // Force reconnection
      if (window.ethereum) {
        // Request account access again
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length === 0) {
          throw new Error('No accounts available');
        }

        // Create fresh provider and signer
        const freshProvider = new ethers.BrowserProvider(window.ethereum);
        const freshSigner = await freshProvider.getSigner();
        
        // Verify the address
        const signerAddress = await freshSigner.getAddress();
        if (account && signerAddress.toLowerCase() === account.address.toLowerCase()) {
          setSigner(freshSigner);
          console.log('✅ Manual signer reconnection successful');
        } else {
          throw new Error('Address mismatch after reconnection');
        }
      } else {
        throw new Error('Ethereum provider not available');
      }
    } catch (error) {
      console.error('Manual reconnection failed:', error);
      setConnectionError(`Manual reconnection failed: ${error.message}`);
      throw error;
    }
  };

  const contextValue: ContractInstancesContextType = {
    fetchBalance,
    SWAP_CONTRACT_INSTANCE,
    AFRISTABLE_CONTRACT_INSTANCE,
    TEST_TOKEN_CONTRACT_INSTANCE,
    PRICEAPI_CONTRACT_INSTANCE,
    SAVING_CONTRACT_INSTANCE,
    signer,
    provider,
    address,
    nativeBalance,
    tokenList: tokens,
    isConnected,
    isCorrectNetwork,
    networkError,
    connectionError,
    reconnectSigner,
    switchToMorphNetwork,
  };

  return (
    <ContractInstances.Provider value={contextValue}>
      {children}
    </ContractInstances.Provider>
  );
};

export default ContractInstanceProvider;

// Custom hook to use the context
export const useContractInstances = (): ContractInstancesContextType => {
  const context = React.useContext(ContractInstances);
  if (context === undefined) {
    throw new Error('useContractInstances must be used within a ContractInstanceProvider');
  }
  return context;
};