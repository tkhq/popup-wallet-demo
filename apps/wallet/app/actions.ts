'use server';

import {
  type TSignedRequest,
  ApiKeyStamper,
  DEFAULT_ETHEREUM_ACCOUNTS,
  TurnkeyApiTypes,
  TurnkeyServerClient,
} from '@turnkey/sdk-server';

const parentOrgId = process.env.NEXT_PUBLIC_ORGANIZATION_ID!;

const stamper = new ApiKeyStamper({
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
});

const client = new TurnkeyServerClient({
  apiBaseUrl: 'https://api.turnkey.com',
  organizationId: parentOrgId,
  stamper,
});

export async function getWhoami(signedRequest: TSignedRequest) {
  // Send the signed request to our Ruby backend
  const resp = await fetch('http://localhost:3002/authenticate', {
    // or your production URL
    method: 'POST',
    body: JSON.stringify(signedRequest),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const responseBody = await resp.json();

  if (!resp.ok) {
    return {
      error: 'User is not authenticated',
      result: [],
    };
  }
  console.log('responseBody', responseBody);
  // Extract organizationId from response
  const organizationId = responseBody.organizationId;

  // Get all wallets for the organization
  const { wallets } = await client.getWallets({
    organizationId,
  });

  // Get accounts for each wallet and flatten into array of addresses
  const addresses = (
    await Promise.all(
      wallets.map(({ walletId }) =>
        client.getWalletAccounts({ organizationId, walletId })
      )
    )
  )
    .flatMap((walletAccount) => walletAccount.accounts)
    .filter((account) => account.address)
    .map((account) => account.address);

  return {
    organizationId,
    result: addresses,
    error: null,
  };
}

export const createUserSubOrg = async ({
  email,
  passkey,
}: {
  email?: string;
  passkey?: {
    challenge: string;
    attestation: TurnkeyApiTypes['v1Attestation'];
  };
}) => {
  const authenticators = passkey
    ? [
        {
          authenticatorName: 'Passkey',
          challenge: passkey.challenge,
          attestation: passkey.attestation,
        },
      ]
    : [];

  let userEmail = email;

  const subOrganizationName = `Sub Org - ${email}`;
  const userName = email ? email.split('@')?.[0] || email : '';

  const subOrg = await client.createSubOrganization({
    organizationId: parentOrgId,
    subOrganizationName,
    rootUsers: [
      {
        userName,
        userEmail,
        oauthProviders: [],
        apiKeys: [],
        authenticators,
      },
    ],
    rootQuorumThreshold: 1,
    wallet: {
      walletName: 'Default Wallet',
      accounts: DEFAULT_ETHEREUM_ACCOUNTS,
    },
  });
  const userId = subOrg.rootUserIds?.[0];
  if (!userId) {
    throw new Error('No root user ID found');
  }
  const { user } = await client.getUser({
    organizationId: subOrg.subOrganizationId,
    userId,
  });

  return { subOrg, user };
};
