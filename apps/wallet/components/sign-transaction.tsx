'use client';

import { useTurnkey } from '@turnkey/react-wallet-kit';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  type Hex,
  hexToBigInt,
  type Address,
  formatGwei,
  ProviderRpcError,
  UserRejectedRequestError,
  serializeTransaction,
} from 'viem';
import { messenger } from '@/lib/window-messenger';

interface EthTransaction {
  from: Address;
  to: Address;
  gas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  nonce: Hex;
  value?: Hex;
  chainId?: Hex;
}

interface SignTransactionProps {
  transaction: EthTransaction;
  organizationId: string;
}

const truncateAddress = (address: Address) => {
  return `${address.slice(0, 6)}•••${address.slice(-4)}`;
};

export function SignTransaction({ transaction, organizationId }: SignTransactionProps) {
  const { httpClient } = useTurnkey();

  const value = transaction.value ?? '0x0';
  const valueInEth = Number(hexToBigInt(value)) / 1e18;
  const maxGasFee = Number(
    formatGwei(
      hexToBigInt(transaction.gas) * hexToBigInt(transaction.maxFeePerGas)
    )
  );

  const handleConfirm = async () => {
    if (!httpClient) {
      messenger.send('eth_signTransaction', {
        error: new ProviderRpcError(new Error('No active Turnkey session'), { code: -32603 }),
      });
      return;
    }

    try {
      const chainId = transaction.chainId ? Number(hexToBigInt(transaction.chainId)) : 11155111;
      const serializedTx = serializeTransaction({
        type: 'eip1559',
        to: transaction.to,
        from: transaction.from,
        chainId,
        gas: hexToBigInt(transaction.gas),
        maxFeePerGas: hexToBigInt(transaction.maxFeePerGas),
        maxPriorityFeePerGas: hexToBigInt(transaction.maxPriorityFeePerGas),
        nonce: Number(hexToBigInt(transaction.nonce)),
        value: hexToBigInt(value),
      });

      const { signedTransaction } = await httpClient.signTransaction({
        signWith: transaction.from,
        unsignedTransaction: serializedTx.slice(2),
        type: 'TRANSACTION_TYPE_ETHEREUM',
        organizationId,
      });

      messenger.send('eth_signTransaction', { result: `0x${signedTransaction}` });
    } catch (e) {
      messenger.send('eth_signTransaction', {
        error: new ProviderRpcError(
          e instanceof Error ? e : new Error('Transaction signing failed'),
          { code: -32603 }
        ),
      });
    }
  };

  const handleDeny = () => {
    messenger.send('eth_signTransaction', {
      error: new UserRejectedRequestError(new Error('User denied transaction')),
    });
  };

  return (
    <Card className="w-full border-none shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <h4 className="font-semibold">Review</h4>
          <p className="text-sm text-muted-foreground">Review Transaction</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Signing with</span>
          <span>{truncateAddress(transaction.from)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Send to</span>
          <span>{truncateAddress(transaction.to)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="flex flex-row items-baseline gap-1">
            <span>{valueInEth}</span>
            <span className="text-muted-foreground text-xs">ETH</span>
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Network fee (max)</span>
          <span className="flex flex-row items-baseline gap-1">
            <span>{maxGasFee.toFixed(2)}</span>
            <span className="text-muted-foreground text-xs">GWEI</span>
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Nonce</span>
          <span>{parseInt(transaction.nonce, 16)}</span>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleDeny} variant="secondary" className="flex-1">
            Deny
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
