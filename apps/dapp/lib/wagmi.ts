import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { holesky } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { berakinWallet } from './connector';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [berakinWallet, injectedWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'RainbowKit demo',
    projectId: 'YOUR_PROJECT_ID',
  }
);

export const config = createConfig({
  connectors,
  chains: [holesky],
  ssr: true,
  transports: {
    [holesky.id]: http(holesky.rpcUrls.default.http[0]),
  },
});
