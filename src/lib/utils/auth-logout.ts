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
  // 1. Better Auth session termination
  try {
    await signOut();
  } catch (err) {
    console.warn('[AuthLogout] Better Auth signOut error (proceeding with local cleanup):', err);
  }

  // 2. Clear legacy auth Zustand store
  try {
    useAuthStore.getState().logout();
  } catch {}

  // 3. Clear cart store so previous user's cart is not left for the next session
  try {
    useCartStore.getState().clearCart();
  } catch {}

  // 4. Remove all user-identifying customer keys from localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('asterra_customer_email');
      localStorage.removeItem('asterra_last_order_id');
      localStorage.removeItem('asterra_checkout_customer');
      sessionStorage.removeItem('asterra_customer_session');
    } catch {}
  }

  // 5. Invalidate and clear all TanStack Query cache entries
  if (options?.queryClient) {
    try {
      options.queryClient.clear();
      options.queryClient.removeQueries();
    } catch {}
  }

  // 6. Provide feedback notice
  if (options?.onNotice) {
    options.onNotice('Anda telah berhasil keluar dari akun.');
  }

  // 7. Deterministic safe navigation
  if (typeof window !== 'undefined') {
    const path = options?.currentPath || window.location.pathname;
    const isRestrictedPath =
      path.startsWith('/profile') ||
      path.startsWith('/orders') ||
      path.startsWith('/checkout');

    if (options?.redirectTo) {
      window.location.href = options.redirectTo;
    } else if (isRestrictedPath) {
      window.location.href = '/login?logged_out=1';
    } else {
      // Reload current page to flush all React and server-cached state
      window.location.reload();
    }
  }
}
