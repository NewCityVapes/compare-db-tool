import { revalidatePath } from "next/cache";

/** Call after a verdict is saved for a specific comparison slug. */
export function revalidateComparison(canonicalSlug: string) {
  revalidatePath(`/compare/${canonicalSlug}`);
  revalidatePath("/browse");
  revalidatePath("/sitemap.xml");
}

/** Call after a Shopify product sync completes (prices/specs may have changed broadly). */
export function revalidateAllComparisons() {
  revalidatePath("/compare/[slug]", "page");
  revalidatePath("/browse");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
}
