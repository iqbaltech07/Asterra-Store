/**
 * Type-Safe Environment Variables Configuration for Asterra Store
 */

import { getAppBaseUrl } from './utils/url';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: getAppBaseUrl(),

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/asterra_store?schema=public',

  // Auth & Security
  JWT_SECRET: process.env.JWT_SECRET || 'asterra_jwt_secret_dev_change_in_production_min32chars',
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET || 'asterra_nextauth_secret_dev_change_in_production',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || getAppBaseUrl(),

  // Payment Gateway (Tripay)
  TRIPAY_API_KEY: process.env.TRIPAY_API_KEY || 'DEV-tripay-api-key-asterra',
  TRIPAY_PRIVATE_KEY: process.env.TRIPAY_PRIVATE_KEY || 'DEV-tripay-private-key-asterra',
  TRIPAY_MERCHANT_CODE: process.env.TRIPAY_MERCHANT_CODE || 'T12345',
  TRIPAY_IS_PRODUCTION: process.env.TRIPAY_IS_PRODUCTION === 'true',

  // Email Notification
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '1025', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Asterra Store <noreply@asterra.store>',
};

export default env;
