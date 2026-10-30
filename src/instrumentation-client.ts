// Browser error tracking. NEXT_PUBLIC_SENTRY_DSN is fixed at build time; without it Sentry is left out of the bundle.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
    }),
  );
}
