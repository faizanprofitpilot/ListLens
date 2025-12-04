import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net; connect-src 'self' https://*.supabase.co https://api.stripe.com https://generativelanguage.googleapis.com https://www.googleadservices.com https://www.google.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: https://www.googleadservices.com https://googleads.g.doubleclick.net; frame-src https://js.stripe.com;",
          },
        ],
      },
    ]
  },
};

export default nextConfig;
