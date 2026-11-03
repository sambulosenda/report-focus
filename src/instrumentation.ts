import { scrubErrorEvent } from "@/lib/error-tracking";

// Server error tracking. Sentry is only loaded when SENTRY_DSN is set, so local development needs no account.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    // Refuse to start with broken settings, so a deploy fails its health check instead of serving wrong pages.
    const problems = (await import("@/lib/env-check")).envProblems(process.env);
    if (problems.length) throw new Error(`Missing or invalid settings:\n- ${problems.join("\n- ")}`);
  }
  if (process.env.NEXT_RUNTIME === "nodejs") (await import("@/lib/memory-log")).startMemoryLog();
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    // Capture errors without collecting routine request traces.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubErrorEvent,
  });
}

export async function onRequestError(...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
