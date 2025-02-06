import { ProviderRpcError, ProviderRpcErrorCode } from 'viem';
import {
  MessengerConfig,
  SupportedMethod,
  MethodResult,
  Message,
} from './types';

/**
 * Creates a messenger instance for cross-window communication, typically used in popup windows
 * to communicate with their parent/opener window.
 *
 * @example
 * // Create a messenger with specific origin
 * const secureMessenger = createMessenger({ targetOrigin: 'https://trusted-domain.com' });
 *
 * // Create a messenger that can communicate with any origin
 * const openMessenger = createMessenger();
 *
 * @param config - Configuration options for the messenger
 * @param config.targetOrigin - The target origin for postMessage (defaults to '*')
 */
const createMessenger = (config: MessengerConfig = {}) => {
  const targetOrigin = config.targetOrigin || '*';

  /**
   * Sends a message to the parent/opener window without closing the popup
   *
   * @example
   * // Send a response to `eth_requestAccounts` rpc call
   * sendMessage('eth_requestAccounts', ["0x123..."]);
   *
   * // Send an error
   * sendMessage('eth_requestAccounts', undefined, new ProviderRpcError(4001, 'User rejected'));
   *
   * @param method - The method identifier for the message
   * @param result - The result payload (optional)
   * @param error - Error information if the operation failed (optional)
   */
  const sendMessage = <M extends SupportedMethod>(
    method: M,
    result?: MethodResult[M],
    error?: ProviderRpcError
  ) => {
    const message: Message<M> = {
      method,
      ...(error
        ? {
            error: {
              code: error.code as ProviderRpcErrorCode,
              message: error.message,
              data: error.data,
            },
          }
        : {
            result,
          }),
    };

    if (window.opener) {
      window.opener.postMessage(message, targetOrigin);
    }
  };

  /**
   * Closes the current popup window
   */
  const closePopup = () => window.close();

  /**
   * Sends a message to the parent/opener window and automatically closes the popup
   * Useful for one-time operations like connecting wallet or signing transactions
   *
   * @example
   * // Send success and close
   * send('connect', {
   *   result: { address: '0x123...', chainId: 1 }
   * });
   *
   * // Send error and close
   * send('connect', {
   *   error: new ProviderRpcError(4001, 'User rejected')
   * });
   *
   * @param method - The method identifier for the message
   * @param options - Object containing either result or error
   */
  const send = <M extends SupportedMethod>(
    method: M,
    {
      result,
      error,
    }: {
      result?: MethodResult[M];
      error?: ProviderRpcError;
    }
  ) => {
    sendMessage(method, result, error);
    closePopup();
  };

  return {
    sendMessage,
    closePopup,
    send,
  };
};

/**
 * Default messenger instance with unrestricted origin ('*')
 * Use this when you don't need specific origin restrictions
 *
 * @example
 * import { messenger } from './window-messenger';
 *
 * // Send a message and keep window open
 * messenger.sendMessage('connect', { address: '0x123...', chainId: 1 });
 *
 * // Send a message and close window
 * messenger.send('connect', {
 *   result: { address: '0x123...', chainId: 1 }
 * });
 */
const defaultMessenger = createMessenger();

// Export the messenger factory and default instance
export const messenger = defaultMessenger;
