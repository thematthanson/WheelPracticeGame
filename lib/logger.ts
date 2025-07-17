export const verboseEnabled =
  typeof process !== 'undefined' &&
  (process.env.NEXT_PUBLIC_VERBOSE_LOGGING === 'true' || process.env.NODE_ENV === 'development');

function timeStamp() {
  return new Date().toISOString();
}

/**
 * Log only when verbose logging is enabled (set NEXT_PUBLIC_VERBOSE_LOGGING=true).
 * Adds an ISO-timestamp prefix so multiple browsers are easier to compare.
 */
export function vLog(...args: unknown[]): void {
  if (verboseEnabled) {
    // eslint-disable-next-line no-console
    console.log(`[${timeStamp()}]`, ...args);
  }
}

/** Warn and Error pass through unconditionally so we never hide actual errors. */
export const vWarn: typeof console.warn = (...args) => {
  // eslint-disable-next-line no-console
  console.warn(`[${timeStamp()}]`, ...args);
};

export const vError: typeof console.error = (...args) => {
  // eslint-disable-next-line no-console
  console.error(`[${timeStamp()}]`, ...args);
}; 