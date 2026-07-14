import { toSlug } from "./utils";

/**
 * Comparison slugs are symmetric (`a-vs-b` and `b-vs-a` are the same content),
 * which is a duplicate-content problem for search engines. This picks a single
 * canonical order (alphabetical) so there is exactly one indexable URL per pair.
 */
export function canonicalizeSlug(vendor1: string, vendor2: string): string {
  const a = toSlug(vendor1);
  const b = toSlug(vendor2);
  const [first, second] = a <= b ? [a, b] : [b, a];
  return `${first}-vs-${second}`;
}

export function isCanonicalSlug(
  slug: string,
  vendor1Slug: string,
  vendor2Slug: string,
): boolean {
  return slug === canonicalizeSlug(vendor1Slug, vendor2Slug);
}

/** Splits `vendor1-vs-vendor2` on the first `-vs-` occurrence. */
export function parseCompareSlug(
  slug: string,
): { vendor1Slug: string; vendor2Slug: string } | null {
  const idx = slug.indexOf("-vs-");
  if (idx === -1) return null;

  const vendor1Slug = slug.slice(0, idx);
  const vendor2Slug = slug.slice(idx + "-vs-".length);
  if (!vendor1Slug || !vendor2Slug) return null;

  return { vendor1Slug, vendor2Slug };
}
