/**
 * Centralized Customer Logout Utility
 * Completely cleanses client-side session, TanStack Query cache, cart store,
 * and user-identifying localStorage keys to eliminate state retention bugs.
 * Complies with Knowledge OS: Diagnose Full Stack Issue & State Preservation rules.
 */

import { signOut } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import { useCartStore } from '@/store/use-cart-store';
import type { QueryClient } from '@tanstack/react-query';

export interface CustomerLogoutOptions {
  queryClient?: QueryClient | null;
  currentPath?: string;
  redirectTo?: string;
  onNotice?: (msg: string) => void;
}

export async function performCustomerLogout(options?: CustomerLogoutOptions): Promise<void> {
  // 1. Instant synchronous client-side purge (Zero-Delay)
  try {
    useAuthStore.getState().logout();
  } catch {}

  try {
    useCartStore.getState().clearCart();
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('asterra_customer_email');
      localStorage.removeItem('asterra_last_order_id');
      localStorage.removeItem('asterra_checkout_customer');
      sessionStorage.removeItem('asterra_customer_session');

      // Instantly expire auth cookies on client
      const expiredSuffix = '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
      document.cookie = `better-auth.session_token${expiredSuffix}`;
      document.cookie = `__Secure-better-auth.session_token${expiredSuffix}`;
      document.cookie = `better-auth.session_data${expiredSuffix}`;
      document.cookie = `asterra_customer_session${expiredSuffix}`;
    } catch {}
  }

  // 2. Invalidate and clear all TanStack Query cache entries
  if (options?.queryClient) {
    try {
      options.queryClient.clear();
      options.queryClient.removeQueries();
    } catch {}
  }

  // 3. Fast non-blocking server session termination (capped at 350ms to prevent database lag delay)
  try {
    await Promise.race([
      signOut(),
      new Promise((resolve) => setTimeout(resolve, 350)),
    ]);
  } catch (err) {
    console.warn('[AuthLogout] Better Auth signOut note (local cleanup succeeded):', err);
  }

  // 4. Provide feedback notice
  if (options?.onNotice) {
    options.onNotice('Anda telah berhasil keluar dari akun.');
  }

  // 5. Deterministic instantaneous navigation
  if (typeof window !== 'undefined') {
    const path = options?.currentPath || window.location.pathname;
    const isRestrictedPath =
      path.startsWith('/profile') ||
      path.startsWith('/orders') ||
      path.startsWith('/checkout');

    const destination = options?.redirectTo || (isRestrictedPath ? '/login?logged_out=1' : '/');
    window.location.replace(destination);
  }
}
