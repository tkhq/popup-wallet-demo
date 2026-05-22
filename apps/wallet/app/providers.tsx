'use client';

import { TurnkeyProvider, type TurnkeyProviderConfig } from '@turnkey/react-wallet-kit';

const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
  authProxyConfigId: process.env.NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID!,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.turnkey.com',
  authProxyUrl:
    process.env.NEXT_PUBLIC_AUTH_PROXY_BASE_URL || 'https://authproxy.turnkey.com',
  ui: {
    supressMissingStylesError: true,
    renderModalInProvider: true,
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <TurnkeyProvider config={turnkeyConfig}>{children}</TurnkeyProvider>;
}
