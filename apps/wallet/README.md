# Popup Wallet

A Turnkey-powered wallet that runs as a browser popup, built with [`@turnkey/react-wallet-kit`](https://www.npmjs.com/package/@turnkey/react-wallet-kit). Opened by the dapp at `localhost:3000`; runs on `localhost:3001`.

See the [root README](../../README.md) for the full architecture, flows, and setup.

## How it works

The wallet only renders when opened by the dapp with a URL-encoded RPC request. It decodes `?request=` and renders the appropriate component:

| Method | Component |
|--------|-----------|
| `eth_requestAccounts` | `AuthButton` — Turnkey auth modal → returns accounts |
| `eth_signTransaction` | `SignTransaction` — transaction review + Turnkey signing |
| `eth_sign` / `personal_sign` | `SignMessage` — message review + Turnkey signing |

Once the user confirms or denies, the result is posted back to the dapp via `postMessage` and the popup closes.

## Key files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Decodes `?request=` and routes to the right component |
| `components/auth.tsx` | Turnkey auth modal; sends accounts back to dapp |
| `components/sign-transaction.tsx` | Transaction review + EIP-1559 serialization + Turnkey signing |
| `components/sign-message.tsx` | Message review + Turnkey raw payload signing |
| `lib/window-messenger.ts` | `postMessage` helper: sends result to opener and closes popup |

## Environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ORGANIZATION_ID` | Yes | Turnkey organization ID |
| `NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID` | Yes | Auth proxy config ID for the Turnkey auth modal |
| `NEXT_PUBLIC_API_BASE_URL` | No | Defaults to `https://api.turnkey.com` |
| `NEXT_PUBLIC_AUTH_PROXY_BASE_URL` | No | Defaults to `https://authproxy.turnkey.com` |

## Running

```bash
npm run dev  # starts on localhost:3001
```

The dapp must also be running on `localhost:3000` to open the popup.
