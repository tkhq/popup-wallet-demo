import { type Connector, createConnector } from 'wagmi';
import { createEIP1193Provider } from './eip1193-provider';
import {
  getAddress,
  type Address,
  type Chain,
  type EIP1193Provider,
} from 'viem';
import { WalletDetailsParams } from '@rainbow-me/rainbowkit';

export interface BerakinWalletOptions {
  chains?: Chain[];
}

let accountsChanged: Connector['onAccountsChanged'] | undefined;
let chainChanged: Connector['onChainChanged'] | undefined;
let disconnect: Connector['onDisconnect'] | undefined;

// Wagmi Wallet Connector
export function berakinWalletConnector(options: BerakinWalletOptions = {}) {
  let provider: EIP1193Provider | null = null;

  type Properties = {};
  type Provider = EIP1193Provider;

  return createConnector<Provider, Properties>((config) => ({
    id: 'berakinWallet',
    name: 'Berakin Wallet',
    type: 'berakinWallet' as const,

    async connect() {
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accountsChanged) {
        accountsChanged = this.onAccountsChanged.bind(this);
        provider.on('accountsChanged', accountsChanged);
      }
      if (!chainChanged) {
        chainChanged = this.onChainChanged.bind(this);
        provider.on('chainChanged', chainChanged);
      }
      if (!disconnect) {
        disconnect = this.onDisconnect.bind(this);
        provider.on('disconnect', disconnect);
      }

      const chainId = await provider.request({ method: 'eth_chainId' });

      return {
        accounts: accounts as readonly `0x${string}`[],
        chainId: Number(chainId),
      };
    },

    async getProvider() {
      if (!provider) {
        provider = createEIP1193Provider();
      }
      return provider;
    },

    async disconnect() {
      const provider = await this.getProvider();
      if (accountsChanged) {
        provider?.removeListener('accountsChanged', accountsChanged);
      }
      if (chainChanged) {
        provider?.removeListener('chainChanged', chainChanged);
      }
      if (disconnect) {
        provider?.removeListener('disconnect', disconnect);
      }
    },

    async getAccounts(): Promise<Address[]> {
      const provider = await this.getProvider();
      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts as Address[];
    },

    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await provider.request({ method: 'eth_chainId' });
      return Number(chainId);
    },

    async isAuthorized() {
      try {
        const account = await this.getAccounts();
        return !!account;
      } catch (_: unknown) {
        return false;
      }
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit('change', {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },

    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit('change', { chainId });
    },

    async onDisconnect() {
      config.emitter.emit('disconnect');

      const provider = await this.getProvider();
      if (accountsChanged) {
        provider.removeListener('accountsChanged', accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        provider.removeListener('chainChanged', chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        provider.removeListener('disconnect', disconnect);
        disconnect = undefined;
      }
    },
  }));
}

// RainbowKit Wallet Connector
export const berakinWallet = () => {
  return {
    id: 'berakinWallet',
    name: 'Berakin Wallet',
    iconUrl: 'https://berakin-dev.vercel.app/logos/short_black.svg',
    iconBackground: '#ffffff',
    downloadUrls: {
      chrome: '',
    },
    createConnector: (walletDetails: WalletDetailsParams) => {
      const connector = berakinWalletConnector();
      return createConnector((config) => ({
        ...connector(config),
        ...walletDetails,
      }));
    },
  };
};
