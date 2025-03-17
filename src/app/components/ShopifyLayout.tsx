"use client";
import { useEffect, useState } from "react";

export default function ShopifyLayout({ type }: { type: "header" | "footer" }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    async function fetchShopifyLayout() {
      try {
        const res = await fetch(
          type === "header" ? "/api/shopify-header" : "/api/shopify-footer"
        );
        if (!res.ok) throw new Error(`Failed to fetch Shopify ${type}`);
        const data = await res.json();

        // Ensure HTML is properly formatted
        setHtml(data.html.trim());
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
