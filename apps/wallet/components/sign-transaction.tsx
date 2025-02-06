'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  type Hex,
  hexToBigInt,
  type Address,
  formatGwei,
  UserRejectedRequestError,
  serializeTransaction,
} from 'viem';
import { messenger } from '@/lib/window-messenger';
import { getTurnkey } from '@/lib/turnkey';

interface EthTransaction {
  from: Address;
  to: Address;
  gas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  nonce: Hex;
  value: Hex;
}

interface SignTransactionProps {
  transaction: EthTransaction;
  organizationId: string;
}

const truncateAddress = (address: Address) => {
  return `${address.slice(0, 6)}•••${address.slice(-4)}`;
};

export function SignTransaction({
  transaction,
  organizationId,
}: SignTransactionProps) {
  // Convert wei to ETH for display
  const valueInEth = Number(BigInt(transaction.value)) / 1e18;

  // Calculate max possible gas fee in ETH
  const maxGasFee = Number(
    formatGwei(
      hexToBigInt(transaction.gas) * hexToBigInt(transaction.maxFeePerGas)
    )
  );

  const handleConfirm = async () => {
    // Serialize the transaction
    const serializedTx = serializeTransaction({
      ...transaction,
      chainId: 17000, // Make sure to add chainId
      // Convert hex values to bigint where needed
      gas: hexToBigInt(transaction.gas),
      maxFeePerGas: hexToBigInt(transaction.maxFeePerGas),
      maxPriorityFeePerGas: hexToBigInt(transaction.maxPriorityFeePerGas),
      nonce: Number(transaction.nonce), // Convert hex nonce to number
      value: hexToBigInt(transaction.value),
    });

    // Remove '0x' prefix
    const serializedTxWithoutPrefix = serializedTx.slice(2);

    const turnkey = getTurnkey();
    const passkeyClient = turnkey.passkeyClient();
    const { signedTransaction } = await passkeyClient.signTransaction({
      signWith: transaction.from,
      unsignedTransaction: serializedTxWithoutPrefix,
      type: 'TRANSACTION_TYPE_ETHEREUM',
      organizationId,
    });

    messenger.send('eth_signTransaction', {
      result: `0x${signedTransaction}`,
    });
  };

  const handleDeny = () => {
    const error = new UserRejectedRequestError(
      new Error('User denied transaction')
    );
    messenger.send('eth_signTransaction', { error });
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
