import { createConfig, http } from 'wagmi';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// Define Core Testnet
const coreTestnet = {
  id: 1115,
  name: 'Core Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'tCORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test2.btcs.network'],
    },
    public: {
      http: ['https://rpc.test2.btcs.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Core Testnet Explorer',
      url: 'https://scan.test2.btcs.network',
    },
  },
  testnet: true,
} as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [coreTestnet],
  connectors: [
    injected(),
    metaMask(),
    // walletConnect({ projectId: 'your-project-id' }),
  ],
  transports: {
    [coreTestnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
