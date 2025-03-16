import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewarePrefetch: "strict", // ✅ Ensures middleware runs properly
  },
  images: {
    domains: ["cdn.shopify.com"], // ✅ Allow Shopify images
  },
};

export default nextConfig;
