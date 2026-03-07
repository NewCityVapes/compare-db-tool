import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface VerdictRow {
  slug: string;
}

export default async function BrowsePage() {
  // Fetch all slugs from verdicts table (paginated)
  const allSlugs: string[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("verdicts")
      .select("slug")
      .order("slug", { ascending: true })
      .range(from, from + 999);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allSlugs.push(...(data as VerdictRow[]).map((d) => d.slug));
      from += 1000;
      if (data.length < 1000) hasMore = false;
    }
  }

  // Group by first vendor for organized display
  const grouped: Record<string, { slug: string; label: string }[]> = {};

  for (const slug of allSlugs) {
    const parts = slug.split("-vs-");
    if (parts.length !== 2) continue;

    const vendor1 = parts[0]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const vendor2 = parts[1]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const key = vendor1;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      slug,
      label: `${vendor1} vs ${vendor2}`,
    });
  }

  const sortedKeys = Object.keys(grouped).sort();

  return (
    <div className="comparison-container" style={{ padding: "20px 5%" }}>
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
