import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_ANNUAL_PRICE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  APP_URL: z.string().default('https://wandr.app'),
  APPLE_IAP_SHARED_SECRET: z.string().optional(),
  APPLE_IAP_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  database: {
    url: parsed.data.DATABASE_URL,
  },
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.data.REFRESH_TOKEN_EXPIRES_IN,
  },
  google: {
    clientId: parsed.data.GOOGLE_CLIENT_ID,
    clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
    mapsApiKey: parsed.data.GOOGLE_MAPS_API_KEY,
  },
  apple: {
    clientId: parsed.data.APPLE_CLIENT_ID,
    teamId: parsed.data.APPLE_TEAM_ID,
    keyId: parsed.data.APPLE_KEY_ID,
    privateKey: parsed.data.APPLE_PRIVATE_KEY,
  },
  aws: {
    accessKeyId: parsed.data.AWS_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.AWS_SECRET_ACCESS_KEY,
    region: parsed.data.AWS_REGION,
    s3Bucket: parsed.data.AWS_S3_BUCKET,
  },
  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  anthropic: {
    apiKey: parsed.data.ANTHROPIC_API_KEY,
  },
  vision: {
    maxAttractions: 20,
    confidenceThresholds: {
      autoMatch: 0.85,
      suggest: 0.60,
      showHint: 0.30,
    },
  },
  stripe: {
    secretKey: parsed.data.STRIPE_SECRET_KEY,
    webhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
    monthlyPriceId: parsed.data.STRIPE_MONTHLY_PRICE_ID,
    annualPriceId: parsed.data.STRIPE_ANNUAL_PRICE_ID,
    prices: {
      monthly: 499, // $4.99 in cents
      annual: 4790, // $47.90 in cents (20% off $59.88)
    },
  },
  email: {
    resendApiKey: parsed.data.RESEND_API_KEY,
    fromAddress: 'Wandr <noreply@wandr-app.com>',
  },
  appUrl: parsed.data.APP_URL,
  appleIap: {
    sharedSecret: parsed.data.APPLE_IAP_SHARED_SECRET,
    environment: parsed.data.APPLE_IAP_ENVIRONMENT,
    verifyReceiptUrl: parsed.data.APPLE_IAP_ENVIRONMENT === 'production'
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt',
  },
} as const;

export type Config = typeof config;
