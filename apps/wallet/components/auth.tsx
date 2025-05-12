'use client';

import { Button } from '@/components/ui/button';
import { createUserSubOrg, getWhoami } from '@/app/actions';
import { messenger } from '@/lib/window-messenger';
import { getTurnkey } from '../lib/turnkey';
import { Address } from 'viem';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const parentOrgId = process.env.NEXT_PUBLIC_ORGANIZATION_ID!;

export function AuthButton() {
  const turnkey = getTurnkey();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    const passkeyClient = turnkey.passkeyClient();
    try {
      let response;

      try {
        const signedRequest = await passkeyClient.stampGetWhoami({
          organizationId: parentOrgId,
        });

        if (!signedRequest) {
          throw new Error('Failed to get signed request');
        }

        response = await getWhoami(signedRequest);
      } catch (err) {
        // ignore & fall back to creating passkey
      }

      if (!response || response.error || !response.result?.length) {
        const { encodedChallenge, attestation } =
          (await passkeyClient?.createUserPasskey({
            publicKey: {
              user: {
                name: 'Popup Wallet Demo',
                displayName: 'Popup Wallet Demo',
              },
            },
          })) || {};
        // Create a new sub organization for the user
        if (encodedChallenge && attestation) {
          const { subOrg, user } = await createUserSubOrg({
            passkey: {
              challenge: encodedChallenge,
              attestation,
            },
          });
        } else {
          throw new Error('Passkey creation failed');
        }
      } else {
        // Passkey exists
        messenger.send('eth_requestAccounts', {
          result: [
            {
              accounts: response.result as Address[],
              organizationId: response.organizationId,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Failed to sign in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSignIn} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Authenticating' : 'Sign In'}
    </Button>
  );
}
