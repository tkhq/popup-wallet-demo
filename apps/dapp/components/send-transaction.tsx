'use client';

import { useEffect, useState } from 'react';
import { Address, parseEther } from 'viem';
import { usePrepareTransactionRequest, useSendTransaction } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function SendTransaction() {
  const [to, setTo] = useState<string>('');
  const [value, setValue] = useState<string>('');

  const { data: preparedRequest, error: prepareError } =
    usePrepareTransactionRequest({
      to: to as Address,
      value: value ? parseEther(value) : undefined,
    });

  // Hook to send the transaction
  const { sendTransaction, isPending } = useSendTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preparedRequest) {
      sendTransaction(preparedRequest);
    }
  };

  useEffect(() => {
    if (prepareError) {
      console.error('Prepare error:', prepareError);
    }
  }, [prepareError]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Recipient Address</Label>
            <Input
              id="to"
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {prepareError && (
            <div className="text-red-500 text-sm">{prepareError.message}</div>
          )}

          <Button type="submit" disabled={!preparedRequest || isPending}>
            {isPending ? 'Sending...' : 'Send Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
