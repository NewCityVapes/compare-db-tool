// Shared locale-aware comparison-page logic used by both the English route
// (src/app/compare/[slug]/page.tsx) and the French route
// (src/app/fr/compare/[slug]/page.tsx). Keeping this in one place means a
// future edit to the comparison page only has to happen once — the two
// route files are thin wrappers that just supply `locale`.
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { cache } from "react";
import { toSlug } from "../../../../../lib/utils";
import { canonicalizeSlug, parseCompareSlug } from "../../../../../lib/slug";
import {
  getAllComparisonSlugs,
  verdictSlugCandidates,
  pickVerdictRow,
  productsForVendorSlug,
} from "../../../../../lib/comparisons";
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
} from "../../../../../lib/seo-utils";
import type { Product } from "../../../../../lib/seo-utils";
import { getPriceDistributions } from "../../../../../lib/priceStats";
import { getDictionary, localeTag, localizePath, type Locale } from "../../../../../lib/i18n";
import {
  ProductJsonLd,
  FAQJsonLd,
  BreadcrumbJsonLd,
} from "@/components/SEO/JsonLd";
import DistributionBar from "@/components/DistributionBar";
import ClientOnlyRender from "./ClientOnlyRender";
import RelatedComparisons from "./RelatedComparisons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getComparisonStaticParams() {
  const slugs = await getAllComparisonSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ─── Resolve + canonicalize the incoming slug ───
// Comparison slugs are symmetric (a-vs-b === b-vs-a), which is a duplicate
// content problem for search engines. Any non-canonical order permanently
// redirects to the canonical one (within the same locale) before any data
// is fetched.
function resolveCompareRoute(
  rawSlug: string | undefined,
  locale: Locale,
): {
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
    permanentRedirect(localizePath(`/compare/${canonicalSlug}`, locale));
  }

  return { vendor1Slug, vendor2Slug, canonicalSlug };
}

// ─── Fetch every disposable product once, matched to vendors by
// re-slugifying the real `vendor` column (see productsForVendorSlug) rather
// than an `ilike` reconstructed from the URL slug. Wrapped in React's
// cache() so generateMetadata and the page component share one query per
// request instead of fetching twice. Paginated past PostgREST's default
// 1,000-row cap.
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
export async function generateComparisonMetadata(
  rawSlug: string | undefined,
  locale: Locale,
): Promise<Metadata> {
  const { vendor1Slug, vendor2Slug, canonicalSlug } = resolveCompareRoute(
    rawSlug,
    locale,
  );

  const { vendor1Name, vendor2Name } = await resolveVendorNames(
    vendor1Slug,
    vendor2Slug,
  );

  const fullTitle = buildPageTitle(vendor1Name, vendor2Name, locale);
  const title = truncate(fullTitle, 60);

  const fullDesc = buildMetaDescription(
    vendor1Name,
    vendor2Name,
    undefined,
    locale,
  );
  const description = truncate(fullDesc, 155);

  const enPath = `https://compare.newcityvapes.com/compare/${canonicalSlug}`;
  const frPath = `https://compare.newcityvapes.com/fr/compare/${canonicalSlug}`;
  const pageUrl = locale === "fr" ? frPath : enPath;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      locale: localeTag(locale).replace("-", "_"),
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
      languages: {
        "en-CA": enPath,
        "fr-CA": frPath,
      },
    },
  };
}

// ─── PAGE CONTENT ─────────────────────────────────────────
export async function ComparisonPageContent({
  rawSlug,
  locale,
}: {
  rawSlug: string | undefined;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const { vendor1Slug, vendor2Slug, canonicalSlug } = resolveCompareRoute(
    rawSlug,
    locale,
  );

  const allProducts = await fetchAllDisposableProducts();
  const products1 = productsForVendorSlug(allProducts, vendor1Slug);
  const products2 = productsForVendorSlug(allProducts, vendor2Slug);
  const product1 = products1[0] ?? null;
  const product2 = products2[0] ?? null;

  // A pair with no real product data on one side has nothing genuinely
  // comparable to show — a real 404 instead of a half-rendered page.
  if (!product1 || !product2) return notFound();

  const vendor1Name = product1.vendor;
  const vendor2Name = product2.vendor;

  const priceDistributions = getPriceDistributions(allProducts);

  const result = compareProducts(product1, product2, vendor1Name, vendor2Name);
  const faqs = generateFAQs(
    product1,
    product2,
    vendor1Name,
    vendor2Name,
    result,
    locale,
  );

  const comparisonAttributes = [
    { label: dict.attributes.puffCount, key: "puffCount" },
    { label: dict.attributes.ml, key: "ml" },
    { label: dict.attributes.battery, key: "battery" },
    { label: dict.attributes.price, key: "price" },
    { label: dict.attributes.pricePerPuff, key: "pricePerPuff" },
    { label: dict.attributes.pricePerMl, key: "pricePerML" },
    { label: dict.attributes.numberOfFlavours, key: "numberOfFlavours" },
  ];

  // Verdict — the ~2,800 pre-rebuild rows only ever populated the English
  // `content` column; `content_fr` fills in independently over time, so a
  // French page with no translation yet simply omits the verdict section
  // rather than falling back to English prose on a French URL.
  const verdictCandidates = verdictSlugCandidates(
    product1.vendor,
    product2.vendor,
    canonicalSlug,
  );
  const { data: verdictRows } = await supabase
    .from("verdicts")
    .select("slug, content, content_fr")
    .in("slug", verdictCandidates);

  const verdictRow = pickVerdictRow(verdictRows ?? [], verdictCandidates);
  const rawVerdict =
    (locale === "fr" ? verdictRow?.content_fr : verdictRow?.content) ?? "";
  const verdict = sanitizeVerdictHtml(rawVerdict);

  const today = new Date().toLocaleDateString(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const browsePrefix = localizePath("/browse", locale);

  return (
    <>
      {/* JSON-LD structured data */}
      <ProductJsonLd product={product1} vendorName={vendor1Name} locale={locale} />
      <ProductJsonLd product={product2} vendorName={vendor2Name} locale={locale} />
      <FAQJsonLd faqs={faqs} />
      <BreadcrumbJsonLd
        vendor1={vendor1Name}
        vendor2={vendor2Name}
        slug={canonicalSlug}
        locale={locale}
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
              {dict.common.home}
            </a>
            <span className="mx-1">/</span>
          </li>
          <li>
            <a
              href={`https://compare.newcityvapes.com${browsePrefix}`}
              className="text-[#CB9D64] hover:underline"
            >
              {dict.common.comparisons}
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
        {dict.common.dataLastUpdated(today)}
      </p>

      {/* Interactive dropdowns — shown at the TOP, above the SSR table */}
      <ClientOnlyRender
        vendor1={vendor1Slug}
        vendor2={vendor2Slug}
        initialProducts1={products1}
        initialProducts2={products2}
        priceDistributions={priceDistributions}
        locale={locale}
      />

      {/* SERVER-RENDERED visible comparison table — Google can read this */}
      <div className="comparison-container" id="ssr-comparison">
        <h1 className="page-title">
          {vendor1Name} vs {vendor2Name}
        </h1>
        <h2 className="page-subtitle">{dict.common.comparisonSubtitle}</h2>

        {/* Product images + buy buttons */}
        <div className="w-full max-w-[2400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative text-center">
          {[
            { product: product1, vendorName: vendor1Name },
            { product: product2, vendorName: vendor2Name },
          ].map(({ product, vendorName: vName }, i) => {
            const description =
              locale === "fr" ? product.description_fr : product.description;
            return (
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

                <div className="flex flex-wrap justify-center gap-2 my-3 text-xs">
                  {product.puffCount != null && (
                    <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                      {product.puffCount.toLocaleString(localeTag(locale))}{" "}
                      {dict.common.puffs}
                    </span>
                  )}
                  {product.ml != null && (
                    <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                      {product.ml} {dict.common.mlLiquid}
                    </span>
                  )}
                  {product.battery != null && (
                    <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                      {product.battery} {dict.common.mahBattery}
                    </span>
                  )}
                  {product.numberOfFlavours != null && (
                    <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                      {product.numberOfFlavours} {dict.common.flavours}
                    </span>
                  )}
                  {product.pricePerPuff != null && product.pricePerPuff > 0 && (
                    <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 font-semibold">
                      {formatValue(product.pricePerPuff, "pricePerPuff", locale)}/
                      {locale === "fr" ? "bouffée" : "puff"}
                    </span>
                  )}
                </div>

                {description && (
                  <p className="text-sm text-gray-600 max-w-sm mx-auto mb-3 leading-relaxed">
                    {truncate(description, 180)}
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
                  {dict.common.buyNow(product.price.toFixed(2))}
                </a>
              </div>
            );
          })}
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
            const val1Valid =
              !isDerivedPriceKey || (rawVal1 != null && rawVal1 > 0);
            const val2Valid =
              !isDerivedPriceKey || (rawVal2 != null && rawVal2 > 0);
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
                      {val1Valid
                        ? formatValue(val1, key, locale)
                        : dict.common.notAvailable}{" "}
                      {left1wins && <span>🏆</span>}
                    </span>
                    {distribution && val1Valid && (
                      <DistributionBar
                        id={`${key}-1`}
                        stats={distribution}
                        value={val1}
                        locale={locale}
                        formatValue={(v) => formatValue(v, key, locale)}
                      />
                    )}
                  </div>
                  <div className="w-1/2" role="cell">
                    <span
                      className={`text-center block py-1 px-4 rounded-full ${
                        right2wins
                          ? "bg-green-200 font-semibold"
                          : "opacity-70"
                      }`}
                    >
                      {val2Valid
                        ? formatValue(val2, key, locale)
                        : dict.common.notAvailable}{" "}
                      {right2wins && <span>🏆</span>}
                    </span>
                    {distribution && val2Valid && (
                      <DistributionBar
                        id={`${key}-2`}
                        stats={distribution}
                        value={val2}
                        locale={locale}
                        formatValue={(v) => formatValue(v, key, locale)}
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
          <h2
            className="text-xl font-bold text-center mb-6"
            style={{ color: "#2E323B" }}
          >
            {dict.faqHeading(vendor1Name, vendor2Name)}
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
        locale={locale}
      />
    </>
  );
}
