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

/** Short admin-UI date format, e.g. "Jul 24" or "Jul 24, 2025" for past years. */
export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}
