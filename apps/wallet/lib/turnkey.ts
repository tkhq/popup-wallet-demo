import { Turnkey } from '@turnkey/sdk-browser';

const parentOrgId = process.env.NEXT_PUBLIC_ORGANIZATION_ID!;

// Create a singleton instance
let turnkeyInstance: Turnkey | null = null;

export const getTurnkey = (): Turnkey => {
  if (!turnkeyInstance) {
    turnkeyInstance = new Turnkey({
      apiBaseUrl: 'https://api.turnkey.com',
      defaultOrganizationId: parentOrgId,
      rpId: 'localhost',
    });
  }
  return turnkeyInstance;
};
