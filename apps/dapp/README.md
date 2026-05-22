# Demo Dapp

A wagmi + RainbowKit dapp that delegates signing to the Turnkey popup wallet. Runs on `localhost:3000`.

See the [root README](../../README.md) for the full architecture, flows, and setup.

## How it works

The dapp registers a custom wagmi connector (`TurnkeyWallet`) backed by a custom EIP-1193 provider. The provider splits incoming JSON-RPC calls into two paths:

| Path | Methods | Handler |
|------|---------|---------|
| **Public RPC** | `eth_chainId`, `eth_call`, `eth_getBalance`, `eth_getTransactionCount`, `eth_estimateGas`, `eth_sendRawTransaction`, etc. | Forwarded directly to a Sepolia RPC node |
| **Popup** | `eth_requestAccounts`, `eth_signTransaction`, `eth_sign`, `personal_sign` | Opens the wallet app as a popup with the request URL-encoded in `?request=` |

Accounts and `organizationId` are persisted to `localStorage` under `TK:EIP1193Provider:store` so wagmi can reconnect after page refresh without reopening the popup. Disconnecting clears this store so the next connect always requires a fresh login.

## Key files

| File | Purpose |
|------|---------|
| `lib/eip1193-provider.ts` | Custom EIP-1193 provider: routes wallet methods to popup, RPC reads to public node |
| `lib/connector.ts` | wagmi + RainbowKit connector wrapping the EIP-1193 provider |
| `lib/wagmi.ts` | wagmi config: RainbowKit connectors, chains (Sepolia) |

## Environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | No | Sepolia RPC endpoint. Defaults to `https://ethereum-sepolia-rpc.publicnode.com` |

## Running

```bash
npm run dev  # starts on localhost:3000
```

The wallet app must also be running on `localhost:3001`.
