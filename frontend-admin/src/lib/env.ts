/**
 * Type-Safe Environment Variables Configuration for Asterra Store - Admin Console
 */

import { getAppBaseUrl, getStoreUrl, getSalesUrl } from './utils/url';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT || '3001', 10),
  APP_URL: getAppBaseUrl(),
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  STORE_URL: getStoreUrl(),
  SALES_URL: getSalesUrl(),

  // Security & Route Protection
  JWT_SECRET: process.env.JWT_SECRET || '',
};

export default env;
