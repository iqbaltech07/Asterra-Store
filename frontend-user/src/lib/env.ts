/**
 * Type-Safe Environment Variables Configuration for Asterra Store - Customer Storefront
 */

import { getAppBaseUrl, getSalesUrl } from './utils/url';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: getAppBaseUrl(),
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  SALES_URL: getSalesUrl(),

  // Database (Prisma)
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',

  // Auth & Security
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || '',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || getAppBaseUrl(),
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || '',
  JWT_SECRET: process.env.JWT_SECRET || '',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
};

export default env;
