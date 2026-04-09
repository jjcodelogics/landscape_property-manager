/**
 * Simple logging utility that only outputs in development mode
 * In production, logs should go to a proper logging service
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    // TODO: In production, send to logging service (e.g., Sentry, LogRocket, etc.)
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
