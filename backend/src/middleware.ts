/**
 * Next.js Middleware Bridge to Proxy
 * Re-exports the modern proxy.ts network boundary for seamless compatibility across Next.js versions.
 */
export { proxy as middleware, proxy as default, config } from './proxy';
