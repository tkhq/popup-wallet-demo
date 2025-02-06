'use client';
import { useAccount } from 'wagmi';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import { SendTransaction } from '@/components/send-transaction';
import { SignMessage } from '@/components/sign-message';

export default function Home() {
  const { address, status } = useAccount();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-row gap-8 row-start-2 items-center justify-center sm:items-start w-full">
        {status === 'connected' ? (
          <div className="w-full flex flex-col gap-4 items-center justify-center">
            <ConnectButton />
            <SendTransaction />
            <SignMessage />
          </div>
        ) : (
          <ConnectButton />
        )}
      </main>
    </div>
  );
}
