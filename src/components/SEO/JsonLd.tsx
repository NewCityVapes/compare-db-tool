// src/components/SEO/JsonLd.tsx
// ============================================================
// Server component — JSON-LD structured data for Google
// ============================================================

import type { Product } from "../../../lib/seo-utils";

// ─── Product Schema ───
export function ProductJsonLd({
  product,
  vendorName,
}: {
  product: Product;
  vendorName: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.imageUrl || undefined,
    brand: {
      "@type": "Brand",
      name: product.vendor || vendorName,
    },
    description: `${product.title} disposable vape — ${product.puffCount?.toLocaleString() ?? "N/A"} puffs, ${product.ml ?? "N/A"}ML, ${product.battery ?? "N/A"}mAh battery.`,
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            price: product.price.toFixed(2),
            priceCurrency: "CAD",
            availability: "https://schema.org/InStock",
            url: product.collectionHandle
              ? `https://newcityvapes.com/collections/${product.collectionHandle}`
              : `https://newcityvapes.com`,
            seller: {
              "@type": "Organization",
              name: "New City Vapes",
            },
          },
        }
      : {}),
    additionalProperty: [
      product.puffCount != null && {
        "@type": "PropertyValue",
        name: "Puff Count",
        value: product.puffCount.toString(),
      },
      product.ml != null && {
        "@type": "PropertyValue",
        name: "E-Liquid Capacity (ML)",
        value: product.ml.toString(),
      },
      product.battery != null && {
        "@type": "PropertyValue",
        name: "Battery Capacity (mAh)",
        value: product.battery.toString(),
      },
      product.numberOfFlavours != null && {
        "@type": "PropertyValue",
        name: "Available Flavours",
        value: product.numberOfFlavours.toString(),
      },
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── FAQ Schema ───
export function FAQJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Breadcrumb Schema ───
export function BreadcrumbJsonLd({
  vendor1,
  vendor2,
  slug,
}: {
  vendor1: string;
  vendor2: string;
  slug: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://newcityvapes.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Vape Comparisons",
        item: "https://compare.newcityvapes.com",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${vendor1} vs ${vendor2}`,
        item: `https://compare.newcityvapes.com/compare/${slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Organization Schema (for root layout) ───
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "New City Vapes",
    url: "https://newcityvapes.com",
    logo: "https://compare.newcityvapes.com/logo.png",
    address: {
      "@type": "PostalAddress",
      addressCountry: "CA",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
