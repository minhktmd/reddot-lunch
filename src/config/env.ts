// Typed env variables — always import from here, never use process.env directly

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL ?? '',

  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ?? '',

  // Slack
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ?? '',
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? '',
  SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID ?? '',

  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '',

  // Cron
  CRON_SECRET: process.env.CRON_SECRET ?? '',
} as const;

// Validate at startup (server-side only)
if (typeof window === 'undefined') {
  const missing = Object.entries(env)
    .filter(([, v]) => v === '')
    .map(([k]) => k);

  if (missing.length > 0) {
    console.warn(`[env] Missing env vars: ${missing.join(', ')}`);
  }
}
