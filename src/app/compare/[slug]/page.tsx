import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { toSlug } from "../../../../lib/utils";
import { notFound } from "next/navigation";
import {
  formatVendorName,
  buildPageTitle,
  buildMetaDescription,
  compareProducts,
  generateFAQs,
  formatValue,
} from "../../../../lib/seo-utils";
import type { Product } from "../../../../lib/seo-utils";
import {
  ProductJsonLd,
  FAQJsonLd,
  BreadcrumbJsonLd,
} from "../../../components/SEO/JsonLd";
import ClientOnlyRender from "./ClientOnlyRender";
import RelatedComparisons from "./RelatedComparisons";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Helper: fetch first product for a vendor ───
async function fetchProductForVendor(
  vendorSlug: string,
): Promise<Product | null> {
  const formattedVendor = vendorSlug.trim().toLowerCase().replace(/-/g, " ");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("vendor", formattedVendor)
    .eq("productType", "DISPOSABLES")
    .order("title", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0] as Product;
}

// ─── Helper: fetch ALL products for a vendor (for the client dropdown) ───
async function fetchAllProductsForVendor(
  vendorSlug: string,
): Promise<Product[]> {
  const formattedVendor = vendorSlug.trim().toLowerCase().replace(/-/g, " ");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("vendor", formattedVendor)
    .limit(1000)
    .order("title", { ascending: true });

  if (error || !data) return [];
  return data as Product[];
}

// ─── HELPERS ────────────────────────────────────────────────
/** Truncate to a max length, breaking at the last space before the limit */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  const trimmed = str.slice(0, max - 1);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + "…";
}

/** Convert "left"/"right" winner to actual vendor name */
function getWinnerName(
  winner: string,
  vendor1Name: string,
  vendor2Name: string,
): string {
  if (winner === "left") return vendor1Name;
  if (winner === "right") return vendor2Name;
  return winner; // fallback if it's already a name
}

// ─── generateMetadata ───────────────────────────────────────
export async function generateMetadata(context: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;

  if (!slug || !slug.includes("-vs-")) {
    return {
      title: "Compare Disposables | New City Vapes",
      description:
        "Explore side-by-side vape comparisons across top disposable brands in Canada.",
      alternates: {
        canonical: "https://compare.newcityvapes.com",
      },
    };
  }

  const [raw1, raw2] = slug.split("-vs-");
  const vendor1Name = formatVendorName(decodeURIComponent(raw1));
  const vendor2Name = formatVendorName(decodeURIComponent(raw2));

  const fullTitle = buildPageTitle(vendor1Name, vendor2Name);
  const title = truncate(fullTitle, 60);

  const fullDesc = buildMetaDescription(vendor1Name, vendor2Name);
  const description = truncate(fullDesc, 155);

  const pageUrl = `https://compare.newcityvapes.com/compare/${slug}`;

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
  const { slug } = await params;

  const [v1, v2] = slug?.split("-vs-") ?? [];
  if (!v1 || !v2) return notFound();

  const vendor1Slug = toSlug(decodeURIComponent(v1));
  const vendor2Slug = toSlug(decodeURIComponent(v2));
  const combinedSlug = `${vendor1Slug}-vs-${vendor2Slug}`;

  const vendor1Name = formatVendorName(decodeURIComponent(v1));
  const vendor2Name = formatVendorName(decodeURIComponent(v2));

  // Fetch products server-side
  const product1 = await fetchProductForVendor(vendor1Slug);
  const product2 = await fetchProductForVendor(vendor2Slug);
  const products1 = await fetchAllProductsForVendor(vendor1Slug);
  const products2 = await fetchAllProductsForVendor(vendor2Slug);

  // Comparison result & FAQs
  const result =
    product1 && product2
      ? compareProducts(product1, product2, vendor1Name, vendor2Name)
      : null;
  const faqs =
    product1 && product2 && result
      ? generateFAQs(product1, product2, vendor1Name, vendor2Name, result)
      : [];

  const comparisonAttributes = [
    { label: "PUFF COUNT", key: "puffCount" },
    { label: "ML", key: "ml" },
    { label: "BATTERY", key: "battery" },
    { label: "PRICE", key: "price" },
    { label: "PRICE PER PUFF", key: "pricePerPuff" },
    { label: "PRICE PER ML", key: "pricePerML" },
    { label: "NUMBER OF FLAVOURS", key: "numberOfFlavours" },
  ];

  // Verdict
  const { data: verdictData } = await supabase
    .from("verdicts")
    .select("content")
    .eq("slug", combinedSlug)
    .maybeSingle();

  const verdict = verdictData?.content || "";

  // ✅ FIX: Resolve "left"/"right" to actual vendor name
  const winnerDisplay =
    result && result.winner !== "tie"
      ? getWinnerName(result.winner, vendor1Name, vendor2Name)
      : null;

  // ✅ NEW: Last updated date for freshness signal
  const today = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* ✅ JSON-LD structured data (invisible to users, visible to Google) */}
      {product1 && (
        <ProductJsonLd product={product1} vendorName={vendor1Name} />
      )}
      {product2 && (
        <ProductJsonLd product={product2} vendorName={vendor2Name} />
      )}
      <FAQJsonLd faqs={faqs} />
      <BreadcrumbJsonLd
        vendor1={vendor1Name}
        vendor2={vendor2Name}
        slug={combinedSlug}
      />

      {/* ✅ Server-rendered SEO content (visible to Google) */}
      <div className="sr-only" aria-hidden="false">
        <h1>
          {vendor1Name} vs {vendor2Name} — Disposable Vape Comparison Canada
        </h1>
        <p>
          Compare {vendor1Name} and {vendor2Name} disposable vapes side-by-side
          across key specifications including puff count, ML capacity, battery,
          price, and value metrics.
          {/* ✅ FIX: Shows actual vendor name instead of "left"/"right" */}
          {winnerDisplay && (
            <>
              {" "}
              {winnerDisplay} wins with a score of{" "}
              {Math.max(result!.leftScore, result!.rightScore)} to{" "}
              {Math.min(result!.leftScore, result!.rightScore)}.
            </>
          )}
        </p>
        <table>
          <caption>
            {vendor1Name} vs {vendor2Name} Comparison
          </caption>
          <thead>
            <tr>
              <th>Attribute</th>
              <th>{vendor1Name}</th>
              <th>{vendor2Name}</th>
            </tr>
          </thead>
          <tbody>
            {comparisonAttributes.map(({ label, key }) => (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  {formatValue(product1?.[key as keyof Product] as number, key)}
                </td>
                <td>
                  {formatValue(product2?.[key as keyof Product] as number, key)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Breadcrumb navigation */}
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
              href="https://compare.newcityvapes.com"
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

      {/* ✅ NEW: Last updated date — freshness signal for Google */}
      <p className="text-center text-xs text-gray-400 mb-4">
        Data last updated: {today}
      </p>

      {/* ✅ Interactive comparison component */}
      <ClientOnlyRender
        vendor1={decodeURIComponent(v1)}
        vendor2={decodeURIComponent(v2)}
        initialProducts1={products1}
        initialProducts2={products2}
      />

      {/* ✅ Verdict (rendered server-side) */}
      {verdict && (
        <div
          className="rich-verdict max-w-4xl mx-auto text-lg leading-relaxed space-y-6 mt-20"
          dangerouslySetInnerHTML={{ __html: verdict }}
        />
      )}

      {/* ✅ FAQ section (visible HTML + FAQ schema) */}
      {faqs.length > 0 && (
        <section className="max-w-4xl mx-auto mt-16 px-4 text-left">
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ color: "#2E323B" }}
          >
            Frequently Asked Questions: {vendor1Name} vs {vendor2Name}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <article key={idx} className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-gray-600 mt-2">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ✅ Related comparisons — internal links to fix orphan pages */}
      <RelatedComparisons
        vendor1Slug={vendor1Slug}
        vendor2Slug={vendor2Slug}
        currentSlug={combinedSlug}
      />
    </>
  );
}
