import { AuthButton } from '@/components/auth';
import { BerakinIcon } from '@/components/icons';
import { SignTransaction } from '@/components/sign-transaction';
import { SignMessage } from '@/components/sign-message';
import { type SupportedMethod } from '@/lib/types';
import Image from 'next/image';

/**
 * Wallet Page Component
 *
 * This component handles various Ethereum wallet operations based on JSON RPC requests passed via URL parameters.
 *
 * URL Parameters:
 * - request: URL-encoded JSON RPC request containing:
 *   - method: The Ethereum method to execute (e.g., personal_sign, eth_requestAccounts)
 *   - params: Array of parameters specific to the method
 * - organizationId: Optional organization identifier
 *
 * Supported Methods:
 * - eth_requestAccounts: Displays wallet connection interface
 * - eth_signTransaction: Handles transaction signing
 * - eth_sign/personal_sign: Handles message signing
 *
 * Example URL:
 * /?request=%7B%22method%22%3A%22personal_sign%22%2C%22params%22%3A%5B%220x4578616d706c65204d657373616765%22%2C%220xe5F866cD673473e3f787D68744791e88c82295b9%22%5D%7D&organizationId=513115fe-3651-42a8-8cbe
 *
 * The component renders different UI components based on the requested method and displays
 * an error message for unsupported methods.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: { request?: string; organizationId?: string };
}) {
  // Parse the RPC request from the URL which is the encoded JSON RPC request
  const { request, organizationId } = await searchParams;
  const rpcRequest = request ? JSON.parse(decodeURIComponent(request)) : null;

  // Helper function to render the appropriate component based on method
  const renderMethodComponent = (request: any) => {
    switch (request?.method) {
      case 'eth_requestAccounts':
        return (
          <div className="w-full max-w-5xl p-4 text-center space-y-2">
            <h2 className="mb-2 text-md">Connect Wallet</h2>
            <AuthButton />
          </div>
        );
      case 'eth_signTransaction':
        return (
          <SignTransaction
            transaction={request.params[0]}
            organizationId={organizationId || ''}
          />
        );
      case 'eth_sign':
      case 'personal_sign':
        return (
          <SignMessage
            method={request.method as SupportedMethod}
            message={request.params[0]}
            signWith={request.params[1]}
            organizationId={organizationId || ''}
          />
        );
      default:
        return (
          <div className="w-full max-w-5xl p-4 border rounded-xl border-neutral-800 bg-zinc-800/30">
            <h2 className="mb-2 text-lg font-bold text-red-500">
              Method Not Supported
            </h2>
            <p>The requested method "{request?.method}" is not supported.</p>
          </div>
        );
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-2">
      <Image
        src="/wallet-illustration.png"
        alt="Wallet Illustration"
        width={100}
        height={100}
        className="absolute top-0 left-0 w-full h-auto object-cover"
      />
      <BerakinIcon className="w-1/3 h-auto" />
      {/* Show the RPC request details if present */}
      {/* {rpcRequest && (
        <div className="z-10 w-full max-w-5xl p-4 mb-8 border rounded-xl border-neutral-800 bg-zinc-800/30">
          <h2 className="mb-2 text-lg font-bold">RPC Request:</h2>
          <pre className="overflow-auto">
            {JSON.stringify(rpcRequest, null, 2)}
          </pre>
        </div>
      )} */}

      {/* <BerakinIcon /> */}

      {/* Render method-specific component */}
      <div className="flex flex-row items-center justify-between w-full max-w-5xl p-2">
        {rpcRequest && renderMethodComponent(rpcRequest)}
      </div>
    </main>
  );
}
