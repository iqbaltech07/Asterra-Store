import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
  sessionOptions: {
    refetchOnWindowFocus: true,
    refetchInterval: 0,
    refetchWhenOffline: false,
  },
});

export const { signIn, signOut, useSession } = authClient;
