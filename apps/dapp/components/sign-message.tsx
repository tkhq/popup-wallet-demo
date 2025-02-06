'use client';

import { useState } from 'react';
import { useSignMessage } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function SignMessage() {
  const [message, setMessage] = useState<string>('Example Message');

  // Hook to sign the message
  const { signMessage, isPending, error, data } = useSignMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      signMessage({ message });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign Message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error.message}</div>}

          {data && (
            <Card className="bg-muted">
              <CardContent className="p-3">
                <div className="text-muted-foreground text-sm break-all shadow-inner bg-transparent rounded-sm font-mono">
                  {data}
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={!message || isPending}>
            {isPending ? 'Signing...' : 'Sign Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
