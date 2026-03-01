// next.config.ts
// ============================================================
// CHANGES:
// 1. Replaced deprecated `images.domains` with `images.remotePatterns`
// 2. Added security headers (X-Content-Type-Options, etc.)
// 3. Added caching headers for comparison pages
// 4. Added trailingSlash: false for canonical consistency
// ============================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    middlewarePrefetch: "strict",
  },

  // ✅ Replaces deprecated `domains` config
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "newcityvapes.com",
      },
    ],
  },

  // ✅ Canonical URL consistency
  trailingSlash: false,

  reactStrictMode: true,

  // ✅ Security + caching headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Cache comparison pages (they update infrequently)
        source: "/compare/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=43200",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
