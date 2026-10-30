/** Sends an error shown on an error page to Sentry, when browser error tracking is set up. */
export function reportError(error: unknown) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
}
