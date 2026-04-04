const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[log]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[warn]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[error]', ...args);
  },
};
