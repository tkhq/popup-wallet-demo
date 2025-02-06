## Messenger

This package provides a way to send messages between a parent and a child window.

## Usage

### Parent

```ts
import { ParentMessenger } from '@repo/messaging';
import type { EIP1193Provider } from 'viem';

export function createEIP1193Provider(walletUrl: string): EIP1193Provider {
  const messenger = new ParentMessenger();

  const provider: EIP1193Provider = {
    async request({ method, params }) {
      await messenger.openPopup(walletUrl);
      return messenger.request(method, params);
    },

    on(event, listener) {
      messenger.on(event, (message) => {
        if (message.type === 'notification') {
          listener(message.data);
        }
      });
    },

    removeListener(event, listener) {
      messenger.off(event);
    },
  };

  return provider;
}
```

### Child

```ts
import { ChildMessenger } from '@repo/messaging';
import { ProviderRpcErrorCode } from 'viem';

const messenger = new ChildMessenger();

messenger.on('eth_requestAccounts', async (message) => {
  if (message.type !== 'request' || !message.id) return;

  try {
    const accounts = await getAccounts(); // Your account logic
    await messenger.sendResponse(message.id, accounts);
  } catch (error) {
    await messenger.sendResponse(message.id, undefined, {
      code: ProviderRpcErrorCode.UserRejectedRequest,
      message: 'User rejected the request',
    });
  }
});

// Export the messenger instance
export { messenger };
```
