import type { Metadata } from "next";
import { getComparisonsWithVerdictStatus } from "../../../lib/comparisons";
import {
  ItemListJsonLd,
  BreadcrumbListJsonLd,
} from "../../components/SEO/JsonLd";
import BrowseClient from "./BrowseClient";

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

export default async function BrowsePage() {
  const comparisons = await getComparisonsWithVerdictStatus();

  return (
    <div className="comparison-container" style={{ padding: "20px 5%" }}>
      <ItemListJsonLd
        items={comparisons.map((c) => ({
          url: `https://compare.newcityvapes.com/compare/${c.slug}`,
          name: `${c.vendor1} vs ${c.vendor2}`,
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
        style={{ marginBottom: "24px", fontSize: "18px", color: "#666" }}
      >
        Browse {comparisons.length} side-by-side comparisons across every
        disposable vape brand we carry. Click any comparison to see detailed
        specs, pricing and our expert verdict.
      </p>

      <BrowseClient comparisons={comparisons} />
    </div>
  );
}
