import {
  EIP1193Provider,
  EIP1193EventMap,
  EIP1193RequestFn,
  EIP1474Methods,
  WalletRpcSchema,
  RpcRequestError,
} from 'viem';
import { holesky } from 'viem/chains';
import { getHttpRpcClient } from 'viem/utils';
import EventEmitter from 'events';

interface ProviderStore {
  accounts: string[];
  organizationId?: string;
}

export function createEIP1193Provider(): EIP1193Provider {
  let popup: Window | null = null;
  const eventEmitter = new EventEmitter();

  /**
   * Request queue for handling RPC requests
   * @type {Object}
   * @property {Object} [method: string] - The method name
   * @property {Function} resolve - The resolve function
   * @property {Function} reject - The reject function
   */
  const requestQueue: {
    [method: string]: {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
    };
  } = {};

  const STORAGE_KEY = 'TK:EIP1193Provider:store';

  const getStore = (): ProviderStore => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : { accounts: [], organizationId: undefined };
  };

  const updateStore = (updates: Partial<ProviderStore>) => {
    const currentStore = getStore();
    const newStore = { ...currentStore, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));

    // Emit events only if values have changed
    if (
      updates.accounts &&
      JSON.stringify(updates.accounts) !== JSON.stringify(currentStore.accounts)
    ) {
      eventEmitter.emit('accountsChanged', updates.accounts);
    }
  };

  const updateAccounts = (accounts: string[]) => {
    updateStore({ accounts });
  };

  const updateOrganization = (organizationId: string) => {
    updateStore({ organizationId });
  };

  const handleMessage = (event: MessageEvent) => {
    const { method, result, error } = event.data;

    // Handle RPC responses using method name
    if (method && requestQueue[method]) {
      if (error) {
        requestQueue[method].reject({
          code: error.code,
          message: error.message,
          data: error.data,
        });
      } else {
        // Handle account-related methods with new format
        if (method === 'eth_requestAccounts') {
          const { accounts, organizationId } = result[0];
          updateStore({ accounts, organizationId });

          // Return only the accounts array to maintain EIP1193 compatibility
          requestQueue[method].resolve(accounts);
        } else {
          requestQueue[method].resolve(result);
        }
      }
      delete requestQueue[method];
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
  }

  // Define a set of methods that should use public RPC
  const PUBLIC_RPC_METHODS = new Set([
    'eth_sendRawTransaction',
    'eth_chainId',
    'eth_subscribe',
    'eth_unsubscribe',
    'eth_blobBaseFee',
    'eth_blockNumber',
    'eth_call',
    'eth_coinbase',
    'eth_estimateGas',
    'eth_feeHistory',
    'eth_gasPrice',
    'eth_getBalance',
    'eth_getBlockByHash',
    'eth_getBlockByNumber',
    'eth_getBlockReceipts',
    'eth_getBlockTransactionCountByHash',
    'eth_getBlockTransactionCountByNumber',
    'eth_getCode',
    'eth_getFilterChanges',
    'eth_getFilterLogs',
    'eth_getLogs',
    'eth_getProof',
    'eth_getStorageAt',
    'eth_getTransactionByBlockHashAndIndex',
    'eth_getTransactionByBlockNumberAndIndex',
    'eth_getTransactionByHash',
    'eth_getTransactionCount',
    'eth_getTransactionReceipt',
    'eth_getUncleCountByBlockHash',
    'eth_getUncleCountByBlockNumber',
    'eth_maxPriorityFeePerGas',
    'eth_newBlockFilter',
    'eth_newFilter',
    'eth_newPendingTransactionFilter',
    'eth_syncing',
    'eth_uninstallFilter',
  ]);

  const request: EIP1193RequestFn<EIP1474Methods> = async ({
    method,
    params,
  }) => {
    if (typeof window === 'undefined') {
      throw new Error('Window is not defined');
    }

    // Handle eth_sendTransaction specially as it needs to be signed first
    if (method === 'eth_sendTransaction') {
      const [transaction] = params as WalletRpcSchema[7]['Parameters'];
      const signedTransaction = (await request({
        method: 'eth_signTransaction',
        params: [transaction],
      })) as WalletRpcSchema[7]['ReturnType'];

      // Route the signed transaction through public RPC
      return request({
        method: 'eth_sendRawTransaction',
        params: [signedTransaction],
      });
    }

    // Handle eth_accounts
    if (method === 'eth_accounts') {
      const store = getStore();
      if (store.accounts.length > 0) {
        return store.accounts;
      }
      // If no stored accounts, request them
      return request({ method: 'eth_requestAccounts' });
    }

    // Route public RPC methods through RPC endpoint
    if (PUBLIC_RPC_METHODS.has(method)) {
      // Hardcoded for now, this should be configurable
      const rpcUrl = holesky.rpcUrls.default.http[0];

      if (!rpcUrl) {
        throw new Error('No RPC URL available for current chain');
      }

      const rpcClient = getHttpRpcClient(rpcUrl);
      const response = await rpcClient.request({
        body: {
          method,
          params,
          id: Math.floor(Math.random() * 1000000),
        },
      });
      if (response.error) {
        throw new RpcRequestError({
          body: { method, params },
          error: response.error,
          url: rpcUrl,
        });
      }

      return response.result;
    }

    // Route all other methods through popup
    if (!popup || popup.closed) {
      // Calculate center position
      const width = 360;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const organizationId = getStore().organizationId;

      popup = window.open(
        `http://localhost:3001?request=${encodeURIComponent(JSON.stringify({ method, params }))}&organizationId=${organizationId}`,
        'Berakin Wallet',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    }

    return new Promise((resolve, reject) => {
      // Store promise handlers by method instead of random id
      requestQueue[method] = { resolve, reject };

      setTimeout(() => {
        if (requestQueue[method]) {
          delete requestQueue[method];
          reject(new Error('Request timeout'));
        }
        // 5 minutes timeout
      }, 60000 * 5);
    });
  };

  return {
    request,
    on: eventEmitter.on.bind(eventEmitter),
    removeListener: eventEmitter.removeListener.bind(eventEmitter),
  };
}
