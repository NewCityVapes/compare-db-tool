import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { cache } from "react";
import { toSlug } from "../../../../lib/utils";
import { canonicalizeSlug, parseCompareSlug } from "../../../../lib/slug";
import {
  getAllComparisonSlugs,
  verdictSlugCandidates,
  pickVerdictContent,
  productsForVendorSlug,
} from "../../../../lib/comparisons";
import { notFound, permanentRedirect } from "next/navigation";
import {
  formatVendorName,
  buildPageTitle,
  buildMetaDescription,
  compareProducts,
  generateFAQs,
  formatValue,
  sanitizeVerdictHtml,
  truncate,
} from "../../../../lib/seo-utils";
import type { Product } from "../../../../lib/seo-utils";
import { getPriceDistributions } from "../../../../lib/priceStats";
import {
  ProductJsonLd,
  FAQJsonLd,
  BreadcrumbJsonLd,
} from "../../../components/SEO/JsonLd";
import DistributionBar from "../../../components/DistributionBar";
import ClientOnlyRender from "./ClientOnlyRender";
import RelatedComparisons from "./RelatedComparisons";

// Pages are statically generated for every known vendor pair (see
// generateStaticParams below) and revalidated on-demand when the Shopify
// sync or a verdict save happens (see lib/revalidate.ts). The time-based
// revalidate here is only a safety net in case an on-demand trigger is missed.
export const revalidate = 3600;
export const dynamicParams = true;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Pre-render every valid (both-vendors-have-products) canonical pair ───
export async function generateStaticParams() {
  const slugs = await getAllComparisonSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ─── Resolve + canonicalize the incoming slug ───
// Comparison slugs are symmetric (a-vs-b === b-vs-a), which is a duplicate
// content problem for search engines. Any non-canonical order permanently
// redirects to the canonical one before any data is fetched. Called from
// both generateMetadata and the page component since Next may run them
// concurrently — it's cheap pure-string logic, no DB call involved.
function resolveCompareRoute(rawSlug?: string): {
  vendor1Slug: string;
  vendor2Slug: string;
  canonicalSlug: string;
} {
  if (!rawSlug) notFound();

  const decodedSlug = decodeURIComponent(rawSlug);
  const parsed = parseCompareSlug(decodedSlug);
  if (!parsed) notFound();

  const vendor1Slug = toSlug(parsed.vendor1Slug);
  const vendor2Slug = toSlug(parsed.vendor2Slug);
  const canonicalSlug = canonicalizeSlug(vendor1Slug, vendor2Slug);

  if (decodedSlug !== canonicalSlug) {
    permanentRedirect(`/compare/${canonicalSlug}`);
  }

  return { vendor1Slug, vendor2Slug, canonicalSlug };
}

// ─── Helper: fetch every disposable product once, matched to vendors by
// re-slugifying the real `vendor` column (see productsForVendorSlug) rather
// than an `ilike` reconstructed from the URL slug — the latter is lossy for
// any vendor name with punctuation (e.g. "Drip'n EVO Series 28K"), since the
// stripped apostrophe can never be reconstructed from the slug alone.
// Wrapped in React's cache() so generateMetadata and the page component
// share one query per request instead of fetching twice.
//
// Paginated — the catalog passed 1,000 rows (PostgREST's default response
// cap) a while back, which was silently truncating this to the first 1,000
// rows in default order. Any vendor whose products sorted past that cutoff
// (confirmed with a newly-added vendor) had no product data here at all,
// which meant every comparison page involving it hit the notFound() below.
const fetchAllDisposableProducts = cache(async (): Promise<Product[]> => {
  const products: Product[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("productType", "DISPOSABLES")
      .not("vendor", "is", null)
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) break;
    products.push(...(data as Product[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return products;
});

// ─── Resolve the real, correctly-cased vendor display names ───
// formatVendorName(slug) was previously used everywhere for display text
// (H1, <title>, meta description, breadcrumb, FAQ questions) — it
// reconstructs a name from the URL slug via capitalize-first-letter-of-
// each-word, which both loses the brand's actual casing (e.g. "STLTH"
// becomes "Stlth") and has a regex gap that doesn't capitalize a letter
// directly following a digit (e.g. "80K" becomes "80k"). The real vendor
// string already exists in the products table with correct casing — this
// pulls it directly, falling back to the slug reconstruction only for the
// rare case a pair has no product data (already headed for a 404 anyway).
async function resolveVendorNames(
  vendor1Slug: string,
  vendor2Slug: string,
): Promise<{ vendor1Name: string; vendor2Name: string }> {
  const allProducts = await fetchAllDisposableProducts();
  const product1 = productsForVendorSlug(allProducts, vendor1Slug)[0];
  const product2 = productsForVendorSlug(allProducts, vendor2Slug)[0];

  return {
    vendor1Name: product1?.vendor ?? formatVendorName(vendor1Slug),
    vendor2Name: product2?.vendor ?? formatVendorName(vendor2Slug),
  };
}


// ─── generateMetadata ───────────────────────────────────────
export async function generateMetadata(context: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await context.params;
  const { vendor1Slug, vendor2Slug, canonicalSlug } =
    resolveCompareRoute(rawSlug);

  const { vendor1Name, vendor2Name } = await resolveVendorNames(
    vendor1Slug,
    vendor2Slug,
  );

  const fullTitle = buildPageTitle(vendor1Name, vendor2Name);
  const title = truncate(fullTitle, 60);

  const fullDesc = buildMetaDescription(vendor1Name, vendor2Name);
  const description = truncate(fullDesc, 155);

  const pageUrl = `https://compare.newcityvapes.com/compare/${canonicalSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: "https://compare.newcityvapes.com/logo.png",
          width: 300,
          height: 113,
          alt: `${vendor1Name} vs ${vendor2Name} comparison`,
        },
      ],
    },
    twitter: {
      title,
      description,
      card: "summary",
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

// ─── PAGE COMPONENT ─────────────────────────────────────────
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const { vendor1Slug, vendor2Slug, canonicalSlug } =
    resolveCompareRoute(rawSlug);

  // Fetch products server-side
  const allProducts = await fetchAllDisposableProducts();
  const products1 = productsForVendorSlug(allProducts, vendor1Slug);
  const products2 = productsForVendorSlug(allProducts, vendor2Slug);
  const product1 = products1[0] ?? null;
  const product2 = products2[0] ?? null;

  // A pair with no real product data on one side has nothing genuinely
  // comparable to show — a real 404 instead of a half-rendered page.
  if (!product1 || !product2) return notFound();

  // The real vendor string (correct casing, e.g. "STLTH", "FLAVOUR BEAST
  // ALPHA 80K") rather than a slug reconstruction that both loses brand
  // casing and mis-capitalizes anything like "80K" -> "80k".
  const vendor1Name = product1.vendor;
  const vendor2Name = product2.vendor;

  // Catalog-wide price distributions — where this pair's price-per-puff and
  // price-per-ml sit against every other disposable we sell, not just each
  // other. Computed once from the same allProducts fetch above.
  const priceDistributions = getPriceDistributions(allProducts);

  // Comparison result & FAQs
  const result = compareProducts(product1, product2, vendor1Name, vendor2Name);
  const faqs = generateFAQs(
    product1,
    product2,
    vendor1Name,
    vendor2Name,
    result,
  );

  const comparisonAttributes = [
    { label: "PUFF COUNT", key: "puffCount" },
    { label: "ML", key: "ml" },
    { label: "BATTERY", key: "battery" },
    { label: "PRICE", key: "price" },
    { label: "PRICE PER PUFF", key: "pricePerPuff" },
    { label: "PRICE PER ML", key: "pricePerML" },
    { label: "NUMBER OF FLAVOURS", key: "numberOfFlavours" },
  ];

  // Verdict — the ~2,800 existing rows were keyed by a pre-rebuild slug
  // format (and, for many pairs, under BOTH vendor orderings as separate
  // rows), so lookups check every historical slug form a verdict for this
  // pair could still be stored under. See lib/comparisons.ts for why.
  const verdictCandidates = verdictSlugCandidates(
    product1.vendor,
    product2.vendor,
    canonicalSlug,
  );
  const { data: verdictRows } = await supabase
    .from("verdicts")
    .select("slug, content")
    .in("slug", verdictCandidates);

  const rawVerdict = pickVerdictContent(verdictRows ?? [], verdictCandidates) ?? "";
  const verdict = sanitizeVerdictHtml(rawVerdict);

  const today = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* JSON-LD structured data */}
      <ProductJsonLd product={product1} vendorName={vendor1Name} />
      <ProductJsonLd product={product2} vendorName={vendor2Name} />
      <FAQJsonLd faqs={faqs} />
      <BreadcrumbJsonLd
        vendor1={vendor1Name}
        vendor2={vendor2Name}
        slug={canonicalSlug}
      />

      {/* Breadcrumb */}
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
          <li>
            <a
              href="https://compare.newcityvapes.com/browse"
              className="text-[#CB9D64] hover:underline"
            >
              Comparisons
            </a>
            <span className="mx-1">/</span>
          </li>
          <li className="text-gray-600 font-medium">
            {vendor1Name} vs {vendor2Name}
          </li>
        </ol>
      </nav>

      {/* Freshness date */}
      <p className="text-center text-xs text-gray-400 mb-4">
        Data last updated: {today}
      </p>

      {/* Interactive dropdowns — shown at the TOP, above the SSR table */}
      <ClientOnlyRender
        vendor1={vendor1Slug}
        vendor2={vendor2Slug}
        initialProducts1={products1}
        initialProducts2={products2}
        priceDistributions={priceDistributions}
      />

      {/* SERVER-RENDERED visible comparison table — Google can read this */}
      <div className="comparison-container" id="ssr-comparison">
        <h1 className="page-title">
          {vendor1Name} vs {vendor2Name}
        </h1>
        <h2 className="page-subtitle">Disposable Vape Comparison — Canada</h2>

        {/* Product images + buy buttons */}
        <div className="w-full max-w-[2400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative text-center">
          {[
            { product: product1, vendorName: vendor1Name },
            { product: product2, vendorName: vendor2Name },
          ].map(({ product, vendorName: vName }, i) => (
            <div key={i} className="product-column">
              <h3 className="font-bold text-lg mb-2">{vName}</h3>
              {product.imageUrl && (
                <div className="product-image-container">
                  <Image
                    src={product.imageUrl}
                    alt={`${product.title} disposable vape`}
                    width={350}
                    height={350}
                    className="product-image"
                  />
                </div>
              )}

              {/* Quick spec facts — previously the only info shown up here
                  was the buy button; the real numbers already existed but
                  only appeared in the comparison table further down. */}
              <div className="flex flex-wrap justify-center gap-2 my-3 text-xs">
                {product.puffCount != null && (
                  <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                    {product.puffCount.toLocaleString()} puffs
                  </span>
                )}
                {product.ml != null && (
                  <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                    {product.ml}mL e-liquid
                  </span>
                )}
                {product.battery != null && (
                  <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                    {product.battery}mAh battery
                  </span>
                )}
                {product.numberOfFlavours != null && (
                  <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                    {product.numberOfFlavours} flavours
                  </span>
                )}
                {product.pricePerPuff != null && (
                  <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                    {formatValue(product.pricePerPuff, "pricePerPuff")}/puff
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 max-w-sm mx-auto mb-3 leading-relaxed">
                  {truncate(product.description, 180)}
                </p>
              )}

              <a
                href={`https://newcityvapes.com/collections/${
                  product.collectionHandle ?? toSlug(vName)
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="buy-button-gold"
              >
                BUY NOW — ${product.price.toFixed(2)} CAD
              </a>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <h3 className="comparison-header">
          {vendor1Name} vs {vendor2Name}
        </h3>
        <div
          className="comparison-table"
          role="table"
          aria-label="Vape comparison table"
        >
          {comparisonAttributes.map(({ label, key }) => {
            // pricePerPuff/pricePerML are derived (price ÷ puffCount or ml)
            // and null until a product has been synced since that
            // calculation shipped — ?? 0 previously made "not calculated
            // yet" indistinguishable from "genuinely $0.00", so an unsynced
            // product could render "$0.0000 🏆" and falsely win the row.
            const rawVal1 = product1[key as keyof typeof product1] as
              | number
              | null
              | undefined;
            const rawVal2 = product2[key as keyof typeof product2] as
              | number
              | null
              | undefined;
            const isDerivedPriceKey =
              key === "pricePerPuff" || key === "pricePerML";
            const val1Valid = !isDerivedPriceKey || (rawVal1 != null && rawVal1 > 0);
            const val2Valid = !isDerivedPriceKey || (rawVal2 != null && rawVal2 > 0);
            const val1 = rawVal1 ?? 0;
            const val2 = rawVal2 ?? 0;

            const higherIsBetter = [
              "puffCount",
              "ml",
              "battery",
              "numberOfFlavours",
            ].includes(key);
            const lowerIsBetter = [
              "price",
              "pricePerPuff",
              "pricePerML",
            ].includes(key);

            const left1wins =
              val1Valid &&
              val2Valid &&
              val1 !== val2 &&
              ((higherIsBetter && val1 > val2) ||
                (lowerIsBetter && val1 < val2));
            const right2wins =
              val1Valid &&
              val2Valid &&
              val1 !== val2 &&
              ((higherIsBetter && val2 > val1) ||
                (lowerIsBetter && val2 < val1));

            const distribution =
              key === "pricePerPuff"
                ? priceDistributions.pricePerPuff
                : key === "pricePerML"
                  ? priceDistributions.pricePerML
                  : null;

            return (
              <div key={key} className="attribute-row" role="row">
                <div className="attribute-header" role="columnheader">
                  <h3 className="text-base font-semibold m-0 p-0">{label}</h3>
                </div>
                <div
                  className="attribute-values flex flex-row gap-2 w-full justify-between"
                  role="row"
                >
                  <div className="w-1/2" role="cell">
                    <span
                      className={`text-center block py-1 px-4 rounded-full ${
                        left1wins ? "bg-green-200 font-semibold" : "opacity-70"
                      }`}
                    >
                      {val1Valid ? formatValue(val1, key) : "N/A"}{" "}
                      {left1wins && <span>🏆</span>}
                    </span>
                    {distribution && val1Valid && (
                      <DistributionBar
                        id={`${key}-1`}
                        stats={distribution}
                        value={val1}
                        formatValue={(v) => formatValue(v, key)}
                      />
                    )}
                  </div>
                  <div className="w-1/2" role="cell">
                    <span
                      className={`text-center block py-1 px-4 rounded-full ${
                        right2wins ? "bg-green-200 font-semibold" : "opacity-70"
                      }`}
                    >
                      {val2Valid ? formatValue(val2, key) : "N/A"}{" "}
                      {right2wins && <span>🏆</span>}
                    </span>
                    {distribution && val2Valid && (
                      <DistributionBar
                        id={`${key}-2`}
                        stats={distribution}
                        value={val2}
                        formatValue={(v) => formatValue(v, key)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verdict — sanitized to prevent duplicate title/meta injection */}
      {verdict && (
        <div
          className="rich-verdict max-w-4xl mx-auto leading-relaxed space-y-4 mt-16 px-4"
          dangerouslySetInnerHTML={{ __html: verdict }}
        />
      )}

      {/* FAQ section */}
      {faqs.length > 0 && (
        <section className="max-w-4xl mx-auto mt-12 px-4 text-left">
          {/* Distinct from a generic "Frequently Asked Questions" heading —
              editorial verdict content sometimes has its own FAQ section
              with that exact title, and two adjacent identical headings
              reads as a duplicate/redundant section to both users and
              crawlers. */}
          <h2
            className="text-xl font-bold text-center mb-6"
            style={{ color: "#2E323B" }}
          >
            Quick Comparison FAQ: {vendor1Name} vs {vendor2Name}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <article key={idx} className="border-b border-gray-200 pb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Related comparisons */}
      <RelatedComparisons
        vendor1Slug={vendor1Slug}
        vendor2Slug={vendor2Slug}
        currentSlug={canonicalSlug}
      />
    </>
  );
}
