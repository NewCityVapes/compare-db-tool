// Shared locale-aware homepage logic used by both the English route
// (src/app/(en)/page.tsx) and the French route (src/app/fr/page.tsx) — see
// ComparisonPage.tsx for the same pattern applied to the comparison pages.
import type { Metadata } from "next";
import { getComparisonsWithVerdictStatus } from "../../../lib/comparisons";
import { canonicalizeSlug } from "../../../lib/slug";
import { getDictionary, localizePath, type Locale } from "../../../lib/i18n";
import { OrganizationJsonLd, ItemListJsonLd } from "@/components/SEO/JsonLd";
import HomeSearch from "./HomeSearch";

// The slug the old root-redirect middleware sent everyone to. Keep it
// featured here so its existing inbound links/impressions carry over to a
// real internal link instead of disappearing.
const FEATURED_SLUG = canonicalizeSlug(
  "STLTH TITAN MAX DISPOSABLE",
  "VICE BOX 2",
);

export async function generateHomeMetadata(locale: Locale): Promise<Metadata> {
  const dict = getDictionary(locale);
  const enUrl = "https://compare.newcityvapes.com";
  const frUrl = "https://compare.newcityvapes.com/fr";
  const pageUrl = locale === "fr" ? frUrl : enUrl;

  return {
    title: `${dict.home.title} | New City Vapes`,
    description: dict.home.metaDescription,
    alternates: {
      canonical: pageUrl,
      languages: {
        "en-CA": enUrl,
        "fr-CA": frUrl,
      },
    },
    openGraph: {
      title: `${dict.home.title} | New City Vapes`,
      description: dict.home.metaDescription,
      url: pageUrl,
      type: "website",
      locale: locale === "fr" ? "fr_CA" : "en_CA",
    },
  };
}

export async function HomePageContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const comparisons = await getComparisonsWithVerdictStatus(locale);
  const comparePrefix = localizePath("/compare", locale);
  const browsePrefix = localizePath("/browse", locale);

  const featured = [
    ...comparisons.filter((c) => c.slug === FEATURED_SLUG),
    ...comparisons.filter((c) => c.slug !== FEATURED_SLUG),
  ].slice(0, 8);

  return (
    <div className="comparison-container" style={{ padding: "20px 5%" }}>
      <OrganizationJsonLd />
      <ItemListJsonLd
        items={featured.map((c) => ({
          url: `https://compare.newcityvapes.com${comparePrefix}/${c.slug}`,
          name: `${c.vendor1} vs ${c.vendor2}`,
        }))}
      />

      <section className="text-center max-w-3xl mx-auto mt-8 mb-12">
        <h1 className="page-title">{dict.home.title}</h1>
        <p className="page-subtitle mt-4" style={{ color: "#666" }}>
          {dict.home.subtitle}
        </p>
        <div className="mt-6">
          <HomeSearch
            comparisons={comparisons.map((c) => ({
              slug: c.slug,
              vendor1: c.vendor1,
              vendor2: c.vendor2,
            }))}
            locale={locale}
          />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto mb-12">
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ color: "#2E323B" }}
          >
            {dict.home.popularComparisons}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((c) => (
              <a
                key={c.slug}
                href={`${comparePrefix}/${c.slug}`}
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
          href={browsePrefix}
          className="inline-block buy-button-gold"
          style={{ textDecoration: "none" }}
        >
          {dict.home.browseAll}
        </a>
      </div>
    </div>
  );
}
