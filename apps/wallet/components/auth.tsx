'use client';

import { useTurnkey } from '@turnkey/react-wallet-kit';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { messenger } from '@/lib/window-messenger';
import { Loader2 } from 'lucide-react';
import type { Address } from 'viem';

export function AuthButton() {
  const { handleLogin, session, wallets } = useTurnkey();
  const [isLoading, setIsLoading] = useState(false);
  // Only send accounts when the user explicitly signed in during this popup
  // instance. Without this guard, a persisted Turnkey session would fire the
  // effect on mount and reconnect without any user interaction.
  const loginInitiated = useRef(false);

  useEffect(() => {
    if (!loginInitiated.current || !session || wallets.length === 0) return;

    const addresses = wallets
      .flatMap((w) => w.accounts.map((a) => a.address))
      .filter((addr): addr is Address => !!addr && addr.startsWith('0x'));

    messenger.send('eth_requestAccounts', {
      result: [{ accounts: addresses, organizationId: session.organizationId }],
    });
  }, [session, wallets]);

  const handleSignIn = async () => {
    setIsLoading(true);
    loginInitiated.current = true;
    try {
      await handleLogin();
    } catch (error) {
      loginInitiated.current = false;
      console.error('[wallet] handleLogin threw:', error);
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
