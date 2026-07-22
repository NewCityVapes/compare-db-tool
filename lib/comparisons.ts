import { createClient } from "@supabase/supabase-js";
import { toSlug } from "./utils";
import { canonicalizeSlug, parseCompareSlug } from "./slug";
import type { Product } from "./seo-utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Every vendor pair with real product data on both sides — the full set of
 * genuinely indexable comparison pages. Shared by generateStaticParams,
 * sitemap.xml, and the /browse directory so all three always agree: nothing
 * is sitemapped without also being reachable via an internal link, and
 * nothing is statically built that isn't indexable.
 */
export async function getAllComparisonSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("vendor")
    .eq("productType", "DISPOSABLES")
    .not("vendor", "is", null);

  if (error || !data) return [];

  const vendorSlugs = [
    ...new Set(
      data
        .map((row) => toSlug((row as { vendor: string }).vendor))
        .filter((slug) => slug.length > 0),
    ),
  ];

  const slugs = new Set<string>();
  for (let i = 0; i < vendorSlugs.length; i++) {
    for (let j = i + 1; j < vendorSlugs.length; j++) {
      slugs.add(canonicalizeSlug(vendorSlugs[i], vendorSlugs[j]));
    }
  }

  return [...slugs].sort();
}

/**
 * The pre-rebuild slugifier: lowercase + collapse whitespace, no stripping of
 * punctuation. The `verdicts` table has ~2,800 rows keyed by slugs generated
 * this way (and, in ~half of pairs, keyed under BOTH vendor orderings as
 * separate rows — itself a duplicate-content bug the new canonical ordering
 * fixes going forward). Existing rows aren't renamed, so verdict lookups need
 * to check the old formats too or ~50% of existing editorial content
 * silently stops rendering under the new canonical URLs.
 */
function legacyToSlug(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-");
}

/**
 * All slug forms a verdict for this pair could be stored under, most
 * preferred first: the new canonical slug, either order under the current
 * slugifier, then either order under the legacy slugifier. Vendor names
 * should come from the `products` table (the real, unmangled vendor string)
 * since that's what fed the legacy slug generation, not a slug that's
 * already had punctuation stripped.
 */
export function verdictSlugCandidates(
  vendor1Name: string,
  vendor2Name: string,
  canonicalSlug: string,
): string[] {
  return [...new Set([
    canonicalSlug,
    `${toSlug(vendor1Name)}-vs-${toSlug(vendor2Name)}`,
    `${toSlug(vendor2Name)}-vs-${toSlug(vendor1Name)}`,
    `${legacyToSlug(vendor1Name)}-vs-${legacyToSlug(vendor2Name)}`,
    `${legacyToSlug(vendor2Name)}-vs-${legacyToSlug(vendor1Name)}`,
  ])];
}

/** Picks the highest-priority matching row's content, or null if none match. */
export function pickVerdictContent(
  rows: { slug: string; content: string }[],
  candidatesInPriorityOrder: string[],
): string | null {
  for (const candidate of candidatesInPriorityOrder) {
    const row = rows.find((r) => r.slug === candidate);
    if (row) return row.content;
  }
  return null;
}

/**
 * Matches products to a URL vendor slug by re-slugifying the real `vendor`
 * column (not by reconstructing a search string from the slug). Vendor names
 * with punctuation (e.g. "Drip'n EVO Series 28K" -> "dripn-evo-series-28k")
 * are lossy going one direction — `dripn-evo-series-28k`.replace(/-/g," ")
 * gives "dripn evo series 28k", which will never `ilike`-match "Drip'n EVO
 * Series 28K" in the database. Re-deriving the slug from each row and
 * comparing slug-to-slug is lossless in the direction that matters.
 */
export function productsForVendorSlug(
  products: Product[],
  vendorSlug: string,
): Product[] {
  return products
    .filter((p) => toSlug(p.vendor) === vendorSlug)
    .sort((a, b) => a.title.localeCompare(b.title));
}

async function fetchAllVerdictRows(): Promise<{ slug: string; content: string }[]> {
  const rows: { slug: string; content: string }[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("verdicts")
      .select("slug, content")
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) break;
    rows.push(...(data as { slug: string; content: string }[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export interface ComparisonStatus {
  slug: string;
  vendor1: string;
  vendor2: string;
  hasVerdict: boolean;
}

/**
 * All valid comparison pairs with a real display name per vendor (taken from
 * the products table, not reconstructed from the slug — so "Drip'n EVO
 * Series 28K" shows correctly instead of "Dripn Evo Series 28k") and whether
 * a verdict exists for it. Uses the same verdictSlugCandidates/
 * pickVerdictContent fallback the live page uses, so "has content" here
 * matches exactly what a visitor would actually see.
 */
export async function getComparisonsWithVerdictStatus(): Promise<
  ComparisonStatus[]
> {
  const [productRows, slugs, verdictRows] = await Promise.all([
    supabase
      .from("products")
      .select("vendor")
      .eq("productType", "DISPOSABLES")
      .not("vendor", "is", null)
      .then((res) => res.data ?? []),
    getAllComparisonSlugs(),
    fetchAllVerdictRows(),
  ]);

  const nameBySlug = new Map<string, string>();
  for (const row of productRows as { vendor: string }[]) {
    const slug = toSlug(row.vendor);
    if (slug && !nameBySlug.has(slug)) nameBySlug.set(slug, row.vendor);
  }

  return slugs.map((slug) => {
    const [v1Slug, v2Slug] = slug.split("-vs-");
    const vendor1 = nameBySlug.get(v1Slug) ?? v1Slug;
    const vendor2 = nameBySlug.get(v2Slug) ?? v2Slug;
    const candidates = verdictSlugCandidates(vendor1, vendor2, slug);
    const content = pickVerdictContent(verdictRows, candidates);

    return { slug, vendor1, vendor2, hasVerdict: Boolean(content?.trim()) };
  });
}

export interface ComparisonDetail {
  slug: string;
  vendor1: string;
  vendor2: string;
  content: string;
}

/** Single-pair version of getComparisonsWithVerdictStatus, for the edit page. */
export async function getComparisonDetail(
  slug: string,
): Promise<ComparisonDetail | null> {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;

  const { data: productRows } = await supabase
    .from("products")
    .select("vendor")
    .eq("productType", "DISPOSABLES")
    .not("vendor", "is", null);

  const nameBySlug = new Map<string, string>();
  for (const row of (productRows ?? []) as { vendor: string }[]) {
    const s = toSlug(row.vendor);
    if (s && !nameBySlug.has(s)) nameBySlug.set(s, row.vendor);
  }

  const vendor1 = nameBySlug.get(parsed.vendor1Slug) ?? parsed.vendor1Slug;
  const vendor2 = nameBySlug.get(parsed.vendor2Slug) ?? parsed.vendor2Slug;

  const candidates = verdictSlugCandidates(vendor1, vendor2, slug);
  const { data: verdictRows } = await supabase
    .from("verdicts")
    .select("slug, content")
    .in("slug", candidates);

  const content = pickVerdictContent(verdictRows ?? [], candidates) ?? "";

  return { slug, vendor1, vendor2, content };
}
