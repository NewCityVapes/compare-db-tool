// src/components/SEO/JsonLd.tsx
// ============================================================
// Server component — JSON-LD structured data for Google
// ============================================================

import type { Product } from "../../../lib/seo-utils";
import { truncate } from "../../../lib/seo-utils";
import type { Locale } from "../../../lib/i18n/locale";

// ─── Product Schema ───
export function ProductJsonLd({
  product,
  vendorName,
  locale = "en",
}: {
  product: Product;
  vendorName: string;
  locale?: Locale;
}) {
  const description = locale === "fr" ? product.description_fr : product.description;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.imageUrl || undefined,
    brand: {
      "@type": "Brand",
      name: product.vendor || vendorName,
    },
    // Real product description when available — falls back to a spec-based
    // sentence when it isn't (either not yet translated, for French, or one
    // of the ~3% of products with no Shopify description at all).
    description: description
      ? truncate(description, 300)
      : locale === "fr"
        ? `Vapoteuse jetable ${product.title} — ${product.puffCount?.toLocaleString("fr-CA") ?? "N/D"} bouffées, ${product.ml ?? "N/D"} ML, ${product.battery ?? "N/D"} mAh.`
        : `${product.title} disposable vape — ${product.puffCount?.toLocaleString() ?? "N/A"} puffs, ${product.ml ?? "N/A"}ML, ${product.battery ?? "N/A"}mAh battery.`,
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
  locale = "en",
}: {
  vendor1: string;
  vendor2: string;
  slug: string;
  locale?: Locale;
}) {
  const comparePrefix =
    locale === "fr"
      ? "https://compare.newcityvapes.com/fr"
      : "https://compare.newcityvapes.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "fr" ? "Accueil" : "Home",
        item: "https://newcityvapes.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "fr" ? "Comparaisons de vapoteuses" : "Vape Comparisons",
        item: comparePrefix,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${vendor1} vs ${vendor2}`,
        item: `${comparePrefix}/compare/${slug}`,
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

// ─── Generic Breadcrumb Schema (for /browse and the homepage) ───
export function BreadcrumbListJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── ItemList Schema (for /browse and the homepage) ───
export function ItemListJsonLd({
  items,
}: {
  items: { url: string; name: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
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
