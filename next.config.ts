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

  // This app has no /blogs or /collections routes — those pages live on
  // the main Shopify store. A handful got indexed under this subdomain
  // anyway (old backlinks/shares, or a since-removed proxy) and 404
  // here. Since nothing in this app ever serves these paths, sending them
  // to the real content on newcityvapes.com can only recover otherwise-dead
  // URLs — it can't break an existing route.
  async redirects() {
    return [
      {
        source: "/blogs/:path*",
        destination: "https://newcityvapes.com/blogs/:path*",
        permanent: true,
      },
      {
        source: "/collections/:path*",
        destination: "https://newcityvapes.com/collections/:path*",
        permanent: true,
      },
      {
        source: "/fr/index",
        destination: "/fr",
        permanent: true,
      },
    ];
  },

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
