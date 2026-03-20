import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production — skip local/dev noise
  enabled: process.env.NODE_ENV === "production",

  // Capture 100% of transactions for profiling in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Capture all errors in production
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Environment tag
  environment: process.env.NODE_ENV ?? "development",

  // Strip sensitive data from cookies/headers
  sendDefaultPii: false,

  // Ignore common noise in Next.js
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "NEXT_REDIRECT",
  ],
});
