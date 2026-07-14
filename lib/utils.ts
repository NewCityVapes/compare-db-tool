// Single source of truth for slugification. Previously `lib/utils.ts` only
// lowercased + collapsed whitespace while `RelatedComparisons.tsx` had its own
// stricter regex-based version — the mismatch meant vendor names with
// apostrophes/special characters could produce different slugs in different
// parts of the app (broken links, failed redirects). Every call site now
// imports this one.
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
