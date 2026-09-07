import { revalidatePath } from "next/cache";
import { submitUrlsToIndexNow } from "./indexnow";

const ORIGIN = "https://compare.newcityvapes.com";

/** Call after a verdict is saved for a specific comparison slug. */
export function revalidateComparison(canonicalSlug: string) {
  revalidatePath(`/compare/${canonicalSlug}`);
  revalidatePath(`/fr/compare/${canonicalSlug}`);
  revalidatePath("/browse");
  revalidatePath("/fr/browse");
  revalidatePath("/sitemap.xml");

  void submitUrlsToIndexNow([
    `${ORIGIN}/compare/${canonicalSlug}`,
    `${ORIGIN}/fr/compare/${canonicalSlug}`,
  ]);
}

/** Call after a Shopify product sync completes (prices/specs may have changed broadly). */
export function revalidateAllComparisons() {
  revalidatePath("/compare/[slug]", "page");
  revalidatePath("/fr/compare/[slug]", "page");
  revalidatePath("/browse");
  revalidatePath("/fr/browse");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  revalidatePath("/fr");

  // A full sync can touch any number of comparison pages, but re-deriving
  // the exact diffed set here would mean a second full product query just
  // for this. Submitting the hub pages that always change (home/browse)
  // is a cheap, honest signal without pretending to know which of
  // thousands of comparison pages actually changed.
  void submitUrlsToIndexNow([
    `${ORIGIN}/`,
    `${ORIGIN}/fr`,
    `${ORIGIN}/browse`,
    `${ORIGIN}/fr/browse`,
  ]);
}
