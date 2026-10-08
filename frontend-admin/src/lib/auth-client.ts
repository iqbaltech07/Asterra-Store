import { createAuthClient } from 'better-auth/react';
import { getAppBaseUrl } from './utils/url';

export const authClient = createAuthClient({
  baseURL: getAppBaseUrl(),
});

export const { signIn, signOut, useSession } = authClient;
