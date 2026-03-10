// src/app/compare/[slug]/RelatedComparisons.tsx
// ============================================================
// Server component that renders internal links to related comparisons.
// This fixes the "Orphan page" issue by creating a web of internal links
// between comparison pages that share the same vendor.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function formatVendorFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

  // Split into two groups: comparisons with vendor1 and comparisons with vendor2
  const vendor1Related: { slug: string; label: string }[] = [];
  const vendor2Related: { slug: string; label: string }[] = [];

  for (const item of allSlugs) {
    const parts = item.slug.split("-vs-");
    if (parts.length !== 2) continue;

    const label = `${formatVendorFromSlug(parts[0])} vs ${formatVendorFromSlug(parts[1])}`;

    if (item.slug.includes(vendor1Slug)) {
      vendor1Related.push({ slug: item.slug, label });
    } else if (item.slug.includes(vendor2Slug)) {
      vendor2Related.push({ slug: item.slug, label });
    }
  }

  // Take up to 5 from each group for a total of ~10 links
  const related = [
    ...vendor1Related.slice(0, 5),
    ...vendor2Related.slice(0, 5),
  ];

  if (related.length === 0) return null;

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
        {vendor1Related.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: "#CB9D64" }}
            >
              More {vendor1Name} Comparisons
            </h3>
            <ul className="space-y-1.5">
              {vendor1Related.slice(0, 5).map((item) => (
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
        {vendor2Related.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: "#CB9D64" }}
            >
              More {vendor2Name} Comparisons
            </h3>
            <ul className="space-y-1.5">
              {vendor2Related.slice(0, 5).map((item) => (
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
          Browse all{" "}
          {vendor1Related.length + vendor2Related.length > 10 ? "2,800+" : ""}{" "}
          comparisons →
        </a>
      </div>
    </section>
  );
}
