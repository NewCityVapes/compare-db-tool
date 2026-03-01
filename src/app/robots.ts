// src/app/robots.ts
// ============================================================
// Auto-served at /robots.txt by Next.js App Router
// Replaces the broken next-sitemap.config.cjs approach
// ============================================================

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/dashboard", "/api/", "/_next/"],
      },
    ],
    sitemap: "https://compare.newcityvapes.com/sitemap.xml",
  };
}
