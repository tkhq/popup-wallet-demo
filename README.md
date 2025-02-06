# Popup Demo Wallet

This repository demonstrates a popup-based Ethereum wallet implementation using Next.js, Wagmi, RainbowKit, and Turnkey.
It showcases how to build a dApp that communicates with a popup wallet window for handling Ethereum transactions and message signing.

## Overview

The repository consists of two main applications that work together:

- `dapp`: A Next.js app that serves as the main dApp interface.
- `wallet`: A Next.js app that serves as the popup wallet interface.

## How It Works

### Communication Flow

1. The dApp initiates wallet operations through the Wagmi connector
2. The connector opens a popup window with the wallet application
3. The wallet handles the request and communicates back to the dApp
4. The dApp receives the response and updates accordingly

### Key Components

#### DApp Side

**Wagmi Connector** (`apps/dapp/lib/connector.ts`):

- Implements a custom Wagmi connector for the popup wallet
- Manages wallet connection state and event handling

**EIP-1193 Provider** (`apps/dapp/lib/eip1193-provider.ts`):

- Implements a custom EIP-1193 provider for the popup wallet
- Creates and manages the popup window lifecycle
- Handles RPC requests and responses
- Routes write requests to the popup wallet, and read requests to the rpc provider

#### Wallet Side

**Wallet Page** (`apps/wallet/app/page.tsx`):

- Receives requests via URL parameters, parses and validates them
- Renders appropriate components based on request type
- Handles sending requests to Turnkey's API
- Communicates back to the dApp using window.opener.postMessage

**Window Messenger** (`apps/wallet/lib/window-messenger.ts`):

- Handles sending RPC response messages back to the dApp

### Supported Operations

- Account connection (eth_requestAccounts)
- Transaction signing (eth_signTransaction)
- Message signing (personal_sign, eth_sign)

### Development

To run the dApp and wallet locally, you can use the following commands:

This will start the dApp and wallet in development mode:

```bash
npm run dev
```
