import type { Metadata } from "next";
import { generateBrowseMetadata, BrowsePageContent } from "./BrowsePage";

// Statically generated, revalidated on-demand when a verdict is saved or a
// Shopify sync runs (see lib/revalidate.ts) — this list changes only when
// product/vendor data changes, not on every request.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateBrowseMetadata("en");
}

export default async function BrowsePage() {
  return BrowsePageContent({ locale: "en" });
}
