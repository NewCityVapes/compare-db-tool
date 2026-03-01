// src/app/compare/[slug]/page.tsx
// ============================================================
// REPLACES: page.tsx + metadata.tsx (metadata was not working!)
//
// KEY CHANGES:
// 1. generateMetadata is now exported FROM THIS FILE (Next.js requirement)
// 2. Products are fetched SERVER-SIDE (Google can see comparison data)
// 3. JSON-LD schema for Product, FAQ, Breadcrumb
// 4. FAQ section rendered in HTML
// 5. Semantic H1 is unique per page (not generic)
// 6. Canonical URL is unique per page
// 7. Server-rendered comparison table (SEO) + client interactivity
// ============================================================

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

export const dynamic = "force-dynamic";

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

// ============================================================
// generateMetadata — THIS IS THE FIX
// Your metadata.tsx file was never being read by Next.js.
// Next.js App Router ONLY reads generateMetadata from page.tsx or layout.tsx.
// ============================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

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
  const vendor1 = formatVendorName(raw1);
  const vendor2 = formatVendorName(raw2);

  // Fetch products to determine winner for meta description
  const [p1, p2] = await Promise.all([
    fetchProductForVendor(raw1),
    fetchProductForVendor(raw2),
  ]);

  const result = compareProducts(p1, p2, vendor1, vendor2);
  const title = buildPageTitle(vendor1, vendor2);
  const description = buildMetaDescription(
    vendor1,
    vendor2,
    result.winner !== "tie" ? result.winnerName : undefined,
  );
  const canonicalUrl = `https://compare.newcityvapes.com/compare/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "en_CA",
      siteName: "New City Vapes",
      images: p1?.imageUrl
        ? [{ url: p1.imageUrl, alt: `${vendor1} vs ${vendor2}` }]
        : undefined,
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ============================================================
// Page Component
// ============================================================
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

  const vendor1Name = formatVendorName(v1);
  const vendor2Name = formatVendorName(v2);

  // ✅ Fetch everything server-side (visible to Google)
  const [product1, product2, products1, products2, verdictData] =
    await Promise.all([
      fetchProductForVendor(v1),
      fetchProductForVendor(v2),
      fetchAllProductsForVendor(v1),
      fetchAllProductsForVendor(v2),
      supabase
        .from("verdicts")
        .select("content")
        .eq("slug", combinedSlug)
        .maybeSingle(),
    ]);

  const verdict = verdictData.data?.content || "";
  const result = compareProducts(product1, product2, vendor1Name, vendor2Name);
  const faqs = generateFAQs(
    product1,
    product2,
    vendor1Name,
    vendor2Name,
    result,
  );

  // ─── Comparison attribute rows for server-rendered table ───
  const comparisonAttributes = [
    { label: "PUFF COUNT", key: "puffCount" },
    { label: "ML", key: "ml" },
    { label: "BATTERY", key: "battery" },
    { label: "PRICE", key: "price" },
    { label: "PRICE PER PUFF", key: "pricePerPuff" },
    { label: "PRICE PER ML", key: "pricePerML" },
    { label: "NUMBER OF FLAVOURS", key: "numberOfFlavours" },
  ];

  return (
    <>
      {/* ✅ JSON-LD Structured Data (in HTML source for Google) */}
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

      {/* ✅ Server-rendered SEO content (hidden visually, visible to Google) */}
      {/* This section provides crawlable content even before JS loads */}
      <div className="sr-only" aria-hidden="false">
        <h1>
          {vendor1Name} vs {vendor2Name} — Disposable Vape Comparison Canada
        </h1>
        <p>
          Compare {vendor1Name} and {vendor2Name} disposable vapes side-by-side
          across {comparisonAttributes.length} key attributes including puff
          count, ML capacity, battery life, price, and value metrics.
          {result.winner !== "tie" && (
            <>
              {" "}
              The winner is {result.winnerName} with a score of{" "}
              {Math.max(result.leftScore, result.rightScore)} to{" "}
              {Math.min(result.leftScore, result.rightScore)}.
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

      {/* ✅ Visible breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        className="text-sm text-gray-500 text-center pt-4 pb-2"
      >
        <ol className="flex justify-center gap-1 flex-wrap">
          <li>
            <a href="https://newcityvapes.com" className="hover:underline">
              Home
            </a>
            <span className="mx-1">/</span>
          </li>
          <li>
            <a
              href="https://compare.newcityvapes.com"
              className="hover:underline"
            >
              Comparisons
            </a>
            <span className="mx-1">/</span>
          </li>
          <li className="text-gray-800 font-medium">
            {vendor1Name} vs {vendor2Name}
          </li>
        </ol>
      </nav>

      {/* ✅ Interactive comparison UI (your existing component) */}
      {/* Now receives server-fetched data as initial props */}
      <ClientOnlyRender
        vendor1={decodeURIComponent(v1)}
        vendor2={decodeURIComponent(v2)}
        initialProducts1={products1}
        initialProducts2={products2}
      />

      {/* ✅ Verdict (server-rendered, same as before) */}
      {verdict && (
        <div
          className="rich-verdict max-w-4xl mx-auto text-lg leading-relaxed space-y-6 mt-20"
          dangerouslySetInnerHTML={{ __html: verdict }}
        />
      )}

      {/* ✅ NEW: FAQ Section (server-rendered HTML + matches FAQPage schema) */}
      {faqs.length > 0 && (
        <section className="max-w-3xl mx-auto mt-16 mb-16 px-4 text-left">
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ color: "#2E323B" }}
          >
            Frequently Asked Questions — {vendor1Name} vs {vendor2Name}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <article key={idx} className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
