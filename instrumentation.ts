export const onRequestError = async (
  err: Parameters<typeof import("@sentry/nextjs").captureRequestError>[0],
  request: Parameters<typeof import("@sentry/nextjs").captureRequestError>[1],
  errorContext: Parameters<typeof import("@sentry/nextjs").captureRequestError>[2]
) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(err, request, errorContext);
};

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      debug: false,
    });
  }
}
