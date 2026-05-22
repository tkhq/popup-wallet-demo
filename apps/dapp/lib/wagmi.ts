import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { sepolia } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { turnkeyWallet } from './connector';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [turnkeyWallet],
    },
    {
      groupName: 'Other',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'Demo Dapp',
    projectId: '',
  }
);

export const config = createConfig({
  connectors,
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
        'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
});
