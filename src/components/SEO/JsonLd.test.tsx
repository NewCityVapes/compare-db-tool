import { describe, it, expect } from "vitest";
import {
  ProductJsonLd,
  FAQJsonLd,
  BreadcrumbJsonLd,
  BreadcrumbListJsonLd,
  ItemListJsonLd,
  OrganizationJsonLd,
} from "./JsonLd";
import type { Product } from "../../../lib/seo-utils";

// These are plain (non-hook) functions that return a single <script> element
// with a JSON string in dangerouslySetInnerHTML — calling them directly and
// parsing that string is enough to verify schema shape, no DOM render needed.
function schemaOf(element: React.ReactElement) {
  const html = (
    element.props as { dangerouslySetInnerHTML: { __html: string } }
  ).dangerouslySetInnerHTML.__html;
  return JSON.parse(html);
}

const product: Product = {
  id: "1",
  title: "STLTH Titan Max Disposable",
  vendor: "STLTH",
  price: 24.99,
  puffCount: 10000,
  ml: 20,
  battery: 650,
  imageUrl: "https://cdn.shopify.com/image.jpg",
  numberOfFlavours: 12,
  collectionHandle: "stlth-titan-max",
};

describe("ProductJsonLd", () => {
  it("includes real price/offer data, not a placeholder", () => {
    const schema = schemaOf(ProductJsonLd({ product, vendorName: "STLTH" }));
    expect(schema["@type"]).toBe("Product");
    expect(schema.offers.price).toBe("24.99");
    expect(schema.offers.priceCurrency).toBe("CAD");
  });

  it("never includes AggregateRating or Review (no real review data exists)", () => {
    const schema = schemaOf(ProductJsonLd({ product, vendorName: "STLTH" }));
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.review).toBeUndefined();
  });
});

describe("FAQJsonLd", () => {
  it("maps each FAQ to a Question/Answer pair", () => {
    const schema = schemaOf(
      FAQJsonLd({
        faqs: [{ question: "Which is better?", answer: "STLTH is better." }],
      }),
    );
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity[0].name).toBe("Which is better?");
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe("STLTH is better.");
  });
});

describe("BreadcrumbJsonLd / BreadcrumbListJsonLd", () => {
  it("produces a 3-level breadcrumb for a comparison page", () => {
    const schema = schemaOf(
      BreadcrumbJsonLd({
        vendor1: "STLTH",
        vendor2: "Vice",
        slug: "stlth-vs-vice",
      }),
    );
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[2].item).toContain("stlth-vs-vice");
  });

  it("produces an arbitrary-length breadcrumb from items", () => {
    const schema = schemaOf(
      BreadcrumbListJsonLd({
        items: [
          { name: "Home", url: "https://newcityvapes.com" },
          { name: "Comparisons", url: "https://compare.newcityvapes.com/browse" },
        ],
      }),
    );
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
  });
});

describe("ItemListJsonLd", () => {
  it("assigns sequential positions starting at 1", () => {
    const schema = schemaOf(
      ItemListJsonLd({
        items: [
          { name: "A vs B", url: "https://x/compare/a-vs-b" },
          { name: "C vs D", url: "https://x/compare/c-vs-d" },
        ],
      }),
    );
    expect(schema.itemListElement.map((i: { position: number }) => i.position)).toEqual([
      1, 2,
    ]);
  });
});

describe("OrganizationJsonLd", () => {
  it("identifies the correct legal/brand entity", () => {
    const schema = schemaOf(OrganizationJsonLd());
    expect(schema.name).toBe("New City Vapes");
  });
});
