// src/app/compare/[slug]/RelatedComparisons.tsx
// Queries the products table to find other vendors, then builds related
// comparison links. Works for ALL pages regardless of whether a verdict exists.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  // ✅ Find other vendors that share the same product type
  // Pull a sample of DISPOSABLES vendors to build related comparison links
  const { data: vendorRows } = await supabase
    .from("products")
    .select("vendor")
    .eq("productType", "DISPOSABLES")
    .not("vendor", "is", null)
    .limit(1000);

  if (!vendorRows || vendorRows.length === 0) return null;

  // Get unique vendors as slugs
  const uniqueVendors = [
    ...new Set(vendorRows.map((r) => toSlug(r.vendor))),
  ].filter((v) => v !== vendor1Slug && v !== vendor2Slug && v.length > 0);

  // Build related links for vendor1: vendor1 vs [other vendors]
  // Build related links for vendor2: vendor2 vs [other vendors]
  // Pick vendors that are "popular" — we'll just take a stable slice
  // Shuffle deterministically using vendor slug as seed
  const shuffled = uniqueVendors.sort((a, b) => {
    const hash = (s: string) =>
      s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return (hash(vendor1Slug + a) % 7) - (hash(vendor1Slug + b) % 7);
  });

  const v1Related = shuffled.slice(0, 5).map((v) => ({
    slug: `${vendor1Slug}-vs-${v}`,
    label: `${formatVendorFromSlug(vendor1Slug)} vs ${formatVendorFromSlug(v)}`,
  }));

  const v2Related = shuffled.slice(5, 10).map((v) => ({
    slug: `${vendor2Slug}-vs-${v}`,
    label: `${formatVendorFromSlug(vendor2Slug)} vs ${formatVendorFromSlug(v)}`,
  }));

  // Filter out the current page
  const v1Items = v1Related.filter((i) => i.slug !== currentSlug);
  const v2Items = v2Related.filter((i) => i.slug !== currentSlug);

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
