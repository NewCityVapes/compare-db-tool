// src/app/compare/[slug]/RelatedComparisons.tsx
// ============================================================
// Server component that renders internal links to related comparisons.
// Fixes "Orphan page" issue by creating internal links between pages.
// ✅ Deduplicates apostrophe variants (Drip'N vs Dripn, etc.)
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function formatVendorFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalize a slug for deduplication purposes.
 * Strips apostrophes and special characters so "drip'n-5000" and "dripn-5000"
 * are treated as the same entry.
 */
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[''`]/g, "") // remove apostrophes and backticks
    .replace(/[^a-z0-9-]/g, ""); // remove any other special chars
}

export default async function RelatedComparisons({
  vendor1Slug,
  vendor2Slug,
  currentSlug,
}: {
  vendor1Slug: string;
  vendor2Slug: string;
  currentSlug: string;
}) {
  // Find comparisons that include either vendor1 or vendor2
  const { data: allSlugs } = await supabase
    .from("verdicts")
    .select("slug")
    .or(`slug.ilike.%${vendor1Slug}%,slug.ilike.%${vendor2Slug}%`)
    .neq("slug", currentSlug)
    .limit(100);

  if (!allSlugs || allSlugs.length === 0) return null;

  // Deduplicate: if two slugs normalize to the same thing, keep only one
  const seen = new Set<string>();
  const dedupedSlugs: { slug: string }[] = [];

  for (const item of allSlugs) {
    const normalized = normalizeSlug(item.slug);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    dedupedSlugs.push(item);
  }

  // Split into two groups: comparisons with vendor1 and comparisons with vendor2
  const vendor1Related: { slug: string; label: string }[] = [];
  const vendor2Related: { slug: string; label: string }[] = [];

  // Also normalize the current vendor slugs for matching
  const normalizedV1 = normalizeSlug(vendor1Slug);
  const normalizedV2 = normalizeSlug(vendor2Slug);

  for (const item of dedupedSlugs) {
    const parts = item.slug.split("-vs-");
    if (parts.length !== 2) continue;

    const label = `${formatVendorFromSlug(parts[0])} vs ${formatVendorFromSlug(parts[1])}`;
    const normalizedItemSlug = normalizeSlug(item.slug);

    // Check which vendor this comparison relates to
    if (normalizedItemSlug.includes(normalizedV1)) {
      vendor1Related.push({ slug: item.slug, label });
    } else if (normalizedItemSlug.includes(normalizedV2)) {
      vendor2Related.push({ slug: item.slug, label });
    }
  }

  // Take up to 5 from each group
  const v1Items = vendor1Related.slice(0, 5);
  const v2Items = vendor2Related.slice(0, 5);

  if (v1Items.length === 0 && v2Items.length === 0) return null;

  const vendor1Name = formatVendorFromSlug(vendor1Slug);
  const vendor2Name = formatVendorFromSlug(vendor2Slug);

  return (
    <section className="max-w-4xl mx-auto mt-16 mb-10 px-4">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ color: "#2E323B" }}
      >
        Related Comparisons
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
        {/* Vendor 1 related */}
        {v1Items.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: "#CB9D64" }}
            >
              More {vendor1Name} Comparisons
            </h3>
            <ul className="space-y-1.5">
              {v1Items.map((item) => (
                <li key={item.slug}>
                  <a
                    href={`/compare/${item.slug}`}
                    className="text-gray-700 hover:text-[#CB9D64] hover:underline text-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vendor 2 related */}
        {v2Items.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: "#CB9D64" }}
            >
              More {vendor2Name} Comparisons
            </h3>
            <ul className="space-y-1.5">
              {v2Items.map((item) => (
                <li key={item.slug}>
                  <a
                    href={`/compare/${item.slug}`}
                    className="text-gray-700 hover:text-[#CB9D64] hover:underline text-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Link back to full browse page */}
      <div className="text-center mt-8">
        <a
          href="/browse"
          className="text-[#CB9D64] font-semibold hover:underline"
        >
          Browse all comparisons →
        </a>
      </div>
    </section>
  );
}
