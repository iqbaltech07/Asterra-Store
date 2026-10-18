/**
 * Type-Safe Environment Variables Configuration for Asterra Store - Sales Portal
 */

import { getAppBaseUrl, getStoreUrl } from './utils/url';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT || '3002', 10),
  APP_URL: getAppBaseUrl(),
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  STORE_URL: getStoreUrl(),

  // Security & Route Protection
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
};

export default env;
