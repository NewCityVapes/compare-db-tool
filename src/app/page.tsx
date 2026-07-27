import type { Metadata } from "next";
import { getComparisonsWithVerdictStatus } from "../../lib/comparisons";
import { canonicalizeSlug } from "../../lib/slug";
import {
  OrganizationJsonLd,
  ItemListJsonLd,
} from "../components/SEO/JsonLd";
import HomeSearch from "./HomeSearch";

// Real homepage — this used to be a permanent redirect straight to one
// hardcoded comparison page, which meant the domain root had no indexable
// content of its own and no homepage authority signal for Google.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Disposable Vape Comparison Tool | New City Vapes",
  description:
    "Compare disposable vapes side-by-side across top Canadian brands. Puff count, price, battery life, price-per-puff and more.",
  alternates: {
    canonical: "https://compare.newcityvapes.com",
  },
  openGraph: {
    title: "Disposable Vape Comparison Tool | New City Vapes",
    description:
      "Compare disposable vapes side-by-side across top Canadian brands.",
    url: "https://compare.newcityvapes.com",
    type: "website",
  },
};

// The slug the old root-redirect middleware sent everyone to. Keep it
// featured here so its existing inbound links/impressions carry over to a
// real internal link instead of disappearing.
const FEATURED_SLUG = canonicalizeSlug(
  "STLTH TITAN MAX DISPOSABLE",
  "VICE BOX 2",
);

export default async function HomePage() {
  const comparisons = await getComparisonsWithVerdictStatus();

  const featured = [
    ...comparisons.filter((c) => c.slug === FEATURED_SLUG),
    ...comparisons.filter((c) => c.slug !== FEATURED_SLUG),
  ].slice(0, 8);

  return (
    <div className="comparison-container" style={{ padding: "20px 5%" }}>
      <OrganizationJsonLd />
      <ItemListJsonLd
        items={featured.map((c) => ({
          url: `https://compare.newcityvapes.com/compare/${c.slug}`,
          name: `${c.vendor1} vs ${c.vendor2}`,
        }))}
      />

      <section className="text-center max-w-3xl mx-auto mt-8 mb-12">
        <h1 className="page-title">Disposable Vape Comparison Tool</h1>
        <p className="page-subtitle mt-4" style={{ color: "#666" }}>
          Compare puff count, battery life, price-per-puff, and flavour
          selection side-by-side across every disposable vape brand we carry
          in Canada — so you can pick the right one before you buy.
        </p>
        <div className="mt-6">
          <HomeSearch
            comparisons={comparisons.map((c) => ({
              slug: c.slug,
              vendor1: c.vendor1,
              vendor2: c.vendor2,
            }))}
          />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto mb-12">
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ color: "#2E323B" }}
          >
            Popular Comparisons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((c) => (
              <a
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="block text-center border rounded-lg py-4 px-3 text-sm font-medium hover:border-[#CB9D64] hover:text-[#CB9D64] transition-colors"
                style={{ borderColor: "#e5e5e5", color: "#333" }}
              >
                {c.vendor1} vs {c.vendor2}
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="text-center mb-16">
        <a
          href="/browse"
          className="inline-block buy-button-gold"
          style={{ textDecoration: "none" }}
        >
          Browse All Comparisons →
        </a>
      </div>
    </div>
  );
}
