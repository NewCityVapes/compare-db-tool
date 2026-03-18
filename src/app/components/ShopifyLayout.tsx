"use client";
import { useEffect, useState } from "react";

export default function ShopifyLayout({ type }: { type: "header" | "footer" }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    async function fetchShopifyLayout() {
      try {
        const res = await fetch(
          type === "header" ? "/api/shopify-header" : "/api/shopify-footer",
        );
        if (!res.ok) throw new Error(`Failed to fetch Shopify ${type}`);
        const data = await res.json();

        // ✅ Strip any <title> tags from Shopify HTML before injecting
        const cleanedHtml = data.html
          .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
          .replace(/<meta[^>]*name=["']description["'][^>]*>/gi, "")
          .replace(/<meta[^>]*name=["']robots["'][^>]*>/gi, "")
          .replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi, "")
          .trim();

        setHtml(cleanedHtml);
      } catch (error) {
        console.error(`Error fetching Shopify ${type}:`, error);
      }
    }
    fetchShopifyLayout();
  }, [type]);

  return (
    <div
      className={
        type === "header" ? "shopify-header-wrapper" : "shopify-footer-wrapper"
      }
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
