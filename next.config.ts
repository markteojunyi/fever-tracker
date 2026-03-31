import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: path.join(__dirname),

  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.ingest.us.sentry.io;",
          },
        ],
      },
    ];
  },

  poweredByHeader: false,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
