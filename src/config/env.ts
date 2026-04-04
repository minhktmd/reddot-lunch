// Typed env variables — always import from here, never use process.env directly

export const env = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
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
