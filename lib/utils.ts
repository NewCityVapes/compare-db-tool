import { localeTag, type Locale } from "./i18n/locale";

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

/**
 * Short date format, e.g. "Jul 24, 2026" (en) / "24 juil. 2026" (fr).
 * Defaults to "en" so the (English-only) admin UI's existing callers are
 * unaffected — only the public /browse page passes a locale explicitly.
 */
export function formatUpdatedAt(iso: string, locale: Locale = "en"): string {
  return new Date(iso).toLocaleDateString(localeTag(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
