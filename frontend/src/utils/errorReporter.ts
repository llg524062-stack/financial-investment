/** Global error reporting hook — integrate Sentry / custom API here */
export function reportError(error: unknown, context?: Record<string, string>): void {
  if (import.meta.env.DEV) {
    console.error('[ErrorReporter]', error, context);
  }
  // TODO: production error upload
  // fetch('/api/log/error', { method: 'POST', body: JSON.stringify({ error, context }) })
}
