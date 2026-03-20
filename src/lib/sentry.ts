import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Nullish coalescing ensures dsn is undefined (not the string "undefined")
  // when the env var is missing, which is the correct behaviour.
  dsn: process.env.SENTRY_DSN ?? undefined,

  // Only enable in production — skip local/dev noise
  enabled: process.env.NODE_ENV === "production",

  // Capture 100% of transactions for profiling in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  // Replay 5% of sessions in production; capture full replay on errors
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Environment tag
  environment: process.env.NODE_ENV ?? "development",

  // Strip sensitive data from cookies/headers
  sendDefaultPii: false,

  // Ignore common false positives in Next.js.
  //
  // Per Sentry SDK docs, string entries match as substrings against
  // the error *message*, not the error *name*. Only entries that can
  // appear in error messages are effective here.
  ignoreErrors: [
    // ResizeObserver fires when elements resize — common in charts/carousels,
    // not actionable as an error.
    "ResizeObserver loop",
    // Unhandled promise rejections without an Error object (e.g. a plain
    // `throw "something"`) produce messages like "The rejected promise
    // with reason 'something'". This filters that class of noise.
    "Non-Error promise rejection",
  ],

  // Use beforeSend for fine-grained control over specific error types
  // that can't be matched via string substring on error.message.
  beforeSend(event) {
    // Filter Next.js redirect errors — these are expected navigation
    // signals, not actual errors. The error type name is "NEXT_REDIRECT".
    if (
      event.exception?.values?.some(
        (exc) =>
          exc.type === "NEXT_REDIRECT" ||
          exc.type === "NEXT_NOT_FOUND" ||
          // Next.js 13+ uses these class names
          exc.type === "Error" &&
            exc.value === "NEXT_REDIRECT"
      )
    ) {
      return null;
    }
    return event;
  },
});
