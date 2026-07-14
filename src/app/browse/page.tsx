import type { Metadata } from "next";
import { getAllComparisonSlugs } from "../../../lib/comparisons";
import {
  ItemListJsonLd,
  BreadcrumbListJsonLd,
} from "../../components/SEO/JsonLd";

// Statically generated, revalidated on-demand when a verdict is saved or a
// Shopify sync runs (see lib/revalidate.ts) — this list changes only when
// product/vendor data changes, not on every request.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse All Vape Comparisons | New City Vapes",
  description:
    "Browse all disposable vape comparisons. Compare puff count, price, battery life across every brand available in Canada.",
  alternates: {
    canonical: "https://compare.newcityvapes.com/browse",
  },
  openGraph: {
    title: "Browse All Vape Comparisons | New City Vapes",
    description:
      "Browse all disposable vape comparisons. Compare puff count, price, battery life across every brand available in Canada.",
    url: "https://compare.newcityvapes.com/browse",
    type: "website",
    images: [
      {
        url: "https://compare.newcityvapes.com/logo.png",
        width: 300,
        height: 113,
        alt: "New City Vapes Comparisons",
      },
    ],
  },
};

function formatVendorFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BrowsePage() {
  const allSlugs = await getAllComparisonSlugs();

  // Group by first vendor for organized display
  const grouped: Record<string, { slug: string; label: string }[]> = {};
  const labelsBySlug: Record<string, string> = {};

  for (const slug of allSlugs) {
    const parts = slug.split("-vs-");
    if (parts.length !== 2) continue;

    const vendor1 = formatVendorFromSlug(parts[0]);
    const vendor2 = formatVendorFromSlug(parts[1]);
    const label = `${vendor1} vs ${vendor2}`;
    labelsBySlug[slug] = label;

    const key = vendor1;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ slug, label });
  }

  const sortedKeys = Object.keys(grouped).sort();

  return (
    <div className="comparison-container" style={{ padding: "20px 5%" }}>
      <ItemListJsonLd
        items={allSlugs.map((slug) => ({
          url: `https://compare.newcityvapes.com/compare/${slug}`,
          name: labelsBySlug[slug] ?? slug,
        }))}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://newcityvapes.com" },
          {
            name: "Comparisons",
            url: "https://compare.newcityvapes.com/browse",
          },
        ]}
      />

      <nav
        aria-label="Breadcrumb"
        className="text-sm text-gray-500 text-center pt-4 pb-2"
      >
        <ol className="inline-flex items-center gap-1 flex-wrap">
          <li>
            <a
              href="https://newcityvapes.com/"
              className="text-[#CB9D64] hover:underline"
            >
              Home
            </a>
            <span className="mx-1">/</span>
          </li>
          <li className="text-gray-600 font-medium">Comparisons</li>
        </ol>
      </nav>

      <h1 className="page-title">All Disposable Vape Comparisons</h1>
      <p
        className="page-subtitle"
        style={{ marginBottom: "40px", fontSize: "18px", color: "#666" }}
      >
        Browse {allSlugs.length} side-by-side comparisons across every
        disposable vape brand we carry. Click any comparison to see detailed
        specs, pricing and our expert verdict.
      </p>

      {sortedKeys.map((brand) => (
        <section
          key={brand}
          style={{
            marginBottom: "30px",
            textAlign: "left",
            maxWidth: "1200px",
            margin: "0 auto 30px",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#2E323B",
              borderBottom: "2px solid #CB9D64",
              paddingBottom: "8px",
              marginBottom: "12px",
            }}
          >
            {brand}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {grouped[brand].map((item) => (
              <li key={item.slug} style={{ marginBottom: "6px" }}>
                <a
                  href={`/compare/${item.slug}`}
                  style={{
                    color: "#333",
                    textDecoration: "none",
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
