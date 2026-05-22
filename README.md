# Popup Wallet Demo

A demo showing how to build a browser popup wallet backed by [Turnkey](https://turnkey.com) using [`@turnkey/react-wallet-kit`](https://docs.turnkey.com/sdks/react), integrated into a wagmi/RainbowKit dapp via a custom EIP-1193 provider.

## Architecture

```
apps/
  dapp/    (localhost:3000)  — wagmi + RainbowKit demo dapp
  wallet/  (localhost:3001)  — Turnkey-powered popup wallet (@turnkey/react-wallet-kit)
```

### Component stack

```
RainbowKit UI
  (wallet picker — shows Turnkey Wallet, MetaMask, and other injected wallets)
  ↓
custom wagmi connector  (apps/dapp/lib/connector.ts)
  (createConnector wrapping the EIP-1193 provider)
  ↓
custom EIP-1193 provider  (apps/dapp/lib/eip1193-provider.ts)
  (routes signing → popup, reads → public Sepolia RPC)
  ↓
Turnkey popup wallet  (apps/wallet/ on localhost:3001)
  (@turnkey/react-wallet-kit auth + Turnkey signing API)
```

The provider splits incoming JSON-RPC calls into two paths:

| Path | Methods | Handler |
|------|---------|---------|
| **Public RPC** | `eth_chainId`, `eth_call`, `eth_getBalance`, `eth_getTransactionCount`, `eth_estimateGas`, `eth_sendRawTransaction`, etc. | Forwarded directly to a Sepolia RPC node — no popup |
| **Popup** | `eth_requestAccounts`, `eth_signTransaction`, `eth_sign`, `personal_sign` | Opens the wallet app as a popup with the request URL-encoded in `?request=` |

Every popup operation follows the same round-trip: the dapp opens the wallet with the request in the URL, the user acts in the popup, the popup posts the result back via `postMessage`, then closes itself.

### Connect flow

```
1. User clicks "Connect Wallet" → RainbowKit modal → connector.connect()
2. connector calls provider.request({ method: 'eth_requestAccounts' })
3. Provider opens popup: localhost:3001?request={"method":"eth_requestAccounts",...}
4. User authenticates via Turnkey auth modal (email OTP / passkey / OAuth)
5. Popup posts: { method: 'eth_requestAccounts', result: [{ accounts, organizationId }] }
6. Provider resolves the promise, stores accounts + organizationId in localStorage
7. wagmi marks the connector as connected; dapp UI updates
```

### Send transaction flow

```
1. User submits the Send Transaction form
2. wagmi calls eth_getTransactionCount via public RPC (no popup)
3. wagmi calls provider.request({ method: 'eth_sendTransaction', params: [tx] })
4. Provider intercepts eth_sendTransaction:
   a. Calls eth_signTransaction internally → opens popup with the transaction
   b. User reviews and confirms in the popup
   c. Popup serializes to EIP-1559 RLP, calls Turnkey signTransaction API
   d. Popup posts: { method: 'eth_signTransaction', result: '0x<signedTx>' }
5. Provider broadcasts via eth_sendRawTransaction on the public RPC
6. Returns transaction hash to wagmi
```

## Prerequisites

- Node.js ≥ 20.0.0
- A [Turnkey](https://app.turnkey.com) organization with an auth proxy config

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the wallet app

Create `apps/wallet/.env.local`:

```env
NEXT_PUBLIC_ORGANIZATION_ID=<your-turnkey-org-id>
NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID=<your-auth-proxy-config-id>

# Optional — defaults shown
NEXT_PUBLIC_API_BASE_URL=https://api.turnkey.com
NEXT_PUBLIC_AUTH_PROXY_BASE_URL=https://authproxy.turnkey.com
```

### 3. Configure the dapp (optional)

Create `apps/dapp/.env.local` if you want a specific Sepolia RPC. Without it the dapp falls back to a free PublicNode endpoint.

```env
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-key>
```

### 4. Run

```bash
npm run dev
```

- Dapp: http://localhost:3000
- Wallet: http://localhost:3001

## Supported wallet operations

| Method | Handler |
|--------|---------|
| `eth_requestAccounts` | Turnkey auth modal → returns Ethereum accounts |
| `eth_sendTransaction` | Signs via popup, broadcasts via public RPC |
| `eth_signTransaction` | Signs EIP-1559 transaction via Turnkey |
| `personal_sign` / `eth_sign` | Signs raw payload via Turnkey |

## Key files

| File | Purpose |
|------|---------|
| `apps/dapp/lib/eip1193-provider.ts` | Custom EIP-1193 provider: routes wallet methods to popup, RPC reads to public node |
| `apps/dapp/lib/connector.ts` | wagmi + RainbowKit connector wrapping the EIP-1193 provider |
| `apps/wallet/app/page.tsx` | Popup page: renders the right component based on `?request=` param |
| `apps/wallet/components/auth.tsx` | Connect flow: Turnkey auth modal, sends accounts back to dapp |
| `apps/wallet/components/sign-transaction.tsx` | Transaction review + Turnkey signing |
| `apps/wallet/components/sign-message.tsx` | Message review + Turnkey signing |
| `apps/wallet/lib/window-messenger.ts` | `postMessage` helper: sends result to opener and closes popup |

## Notes

- The wallet can be deployed as a standalone app on any domain — `localhost:3001` is used here for convenience, but the popup and `postMessage` pattern is fully cross-origin. In production, set `targetOrigin` in `apps/wallet/lib/window-messenger.ts` to the dapp's actual origin, and validate `event.origin` in the dapp's message listener (`apps/dapp/lib/eip1193-provider.ts`).
- The wallet runs on a separate origin so its Turnkey session is isolated from the dapp.
- Disconnect clears the dapp-side account store; the next connect always requires a fresh Turnkey login.
- Only Sepolia is configured. To add other chains, update `chains` in `apps/dapp/lib/wagmi.ts` and the `chainId` fallback in `apps/wallet/components/sign-transaction.tsx`.
