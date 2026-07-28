// Shared locale-aware browse-page logic used by both the English route
// (src/app/(en)/browse/page.tsx) and the French route
// (src/app/fr/browse/page.tsx) — see ComparisonPage.tsx for the same
// pattern applied to the comparison pages.
import type { Metadata } from "next";
import { getComparisonsWithVerdictStatus } from "../../../../lib/comparisons";
import { getDictionary, localizePath, type Locale } from "../../../../lib/i18n";
import {
  ItemListJsonLd,
  BreadcrumbListJsonLd,
} from "@/components/SEO/JsonLd";
import BrowseClient from "./BrowseClient";

export async function generateBrowseMetadata(locale: Locale): Promise<Metadata> {
  const dict = getDictionary(locale);
  const enUrl = "https://compare.newcityvapes.com/browse";
  const frUrl = "https://compare.newcityvapes.com/fr/browse";
  const pageUrl = locale === "fr" ? frUrl : enUrl;

  return {
    title: `${dict.browse.title} | New City Vapes`,
    description: dict.browse.metaDescription,
    alternates: {
      canonical: pageUrl,
      languages: {
        "en-CA": enUrl,
        "fr-CA": frUrl,
      },
    },
    openGraph: {
      title: `${dict.browse.title} | New City Vapes`,
      url: pageUrl,
      type: "website",
      locale: locale === "fr" ? "fr_CA" : "en_CA",
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
}

export async function BrowsePageContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const comparisons = await getComparisonsWithVerdictStatus(locale);
  const comparePrefix = localizePath("/compare", locale);
  const browsePrefix = localizePath("/browse", locale);

  return (
    <div className="comparison-container" style={{ padding: "20px 5%" }}>
      <ItemListJsonLd
        items={comparisons.map((c) => ({
          url: `https://compare.newcityvapes.com${comparePrefix}/${c.slug}`,
          name: `${c.vendor1} vs ${c.vendor2}`,
        }))}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: dict.common.home, url: "https://newcityvapes.com" },
          {
            name: dict.common.comparisons,
            url: `https://compare.newcityvapes.com${browsePrefix}`,
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
              {dict.common.home}
            </a>
            <span className="mx-1">/</span>
          </li>
          <li className="text-gray-600 font-medium">
            {dict.common.comparisons}
          </li>
        </ol>
      </nav>

      <h1 className="page-title">{dict.browse.title}</h1>
      <p
        className="page-subtitle"
        style={{ marginBottom: "24px", fontSize: "18px", color: "#666" }}
      >
        {dict.browse.subtitle(comparisons.length)}
      </p>

      <BrowseClient comparisons={comparisons} locale={locale} />
    </div>
  );
}
