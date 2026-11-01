import { scrubErrorEvent } from "@/lib/error-tracking";

// Browser error tracking. NEXT_PUBLIC_SENTRY_DSN is fixed at build time; without it Sentry is left out of the bundle.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend: scrubErrorEvent,
    }),
  );
}
