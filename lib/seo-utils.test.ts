import { describe, it, expect } from "vitest";
import {
  compareProducts,
  buildPageTitle,
  buildMetaDescription,
  generateFAQs,
  formatValue,
  sanitizeVerdictHtml,
  type Product,
} from "./seo-utils";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    title: "Test Vape",
    vendor: "Test Vendor",
    price: 20,
    puffCount: 5000,
    ml: 15,
    battery: 500,
    pricePerPuff: 0.004,
    pricePerML: 1.33,
    numberOfFlavours: 10,
    ...overrides,
  };
}

describe("compareProducts", () => {
  it("awards a point per attribute to whichever side is better", () => {
    const p1 = makeProduct({ puffCount: 6000, price: 25 });
    const p2 = makeProduct({ puffCount: 5000, price: 20 });

    const result = compareProducts(p1, p2, "Vendor A", "Vendor B");

    const puffRow = result.breakdown.find((b) => b.key === "puffCount");
    const priceRow = result.breakdown.find((b) => b.key === "price");

    expect(puffRow?.pointTo).toBe("left"); // higher puff count wins
    expect(priceRow?.pointTo).toBe("right"); // lower price wins
  });

  it("declares a tie when scores are equal", () => {
    const p1 = makeProduct();
    const p2 = makeProduct();

    const result = compareProducts(p1, p2, "Vendor A", "Vendor B");

    expect(result.winner).toBe("tie");
    expect(result.winnerName).toBe("Tie");
  });

  it("does not award a point when an attribute is missing on either side", () => {
    const p1 = makeProduct({ battery: undefined });
    const p2 = makeProduct();

    const result = compareProducts(p1, p2, "Vendor A", "Vendor B");
    const batteryRow = result.breakdown.find((b) => b.key === "battery");

    expect(batteryRow?.pointTo).toBeNull();
  });
});

describe("buildPageTitle / buildMetaDescription length limits", () => {
  it("keeps titles within Google's ~60 character display budget for typical vendor names", () => {
    const title = buildPageTitle("STLTH", "Vice");
    // Longer vendor-name pairs are truncated by the caller (page.tsx); this
    // just guards against the template itself blowing the budget for short names.
    expect(title.length).toBeLessThan(80);
  });

  it("produces a different description for a different pair (not boilerplate)", () => {
    const descA = buildMetaDescription("STLTH", "Vice");
    const descB = buildMetaDescription("Elf Bar", "Lost Mary");
    expect(descA).not.toBe(descB);
  });

  it("mentions the winner when one is provided", () => {
    const desc = buildMetaDescription("STLTH", "Vice", "STLTH");
    expect(desc).toContain("STLTH");
    expect(desc.toLowerCase()).toContain("winner");
  });
});

describe("generateFAQs", () => {
  it("includes the real numeric values, not boilerplate", () => {
    const p1 = makeProduct({ puffCount: 7000 });
    const p2 = makeProduct({ puffCount: 5000 });
    const result = compareProducts(p1, p2, "Vendor A", "Vendor B");
    const faqs = generateFAQs(p1, p2, "Vendor A", "Vendor B", result);

    const puffFaq = faqs.find((f) => f.question.includes("lasts longer"));
    expect(puffFaq?.answer).toContain("7,000");
    expect(puffFaq?.answer).toContain("5,000");
  });

  it("always includes at least the overall-winner and availability FAQs", () => {
    const p1 = makeProduct();
    const p2 = makeProduct();
    const result = compareProducts(p1, p2, "Vendor A", "Vendor B");
    const faqs = generateFAQs(p1, p2, "Vendor A", "Vendor B", result);

    expect(faqs.length).toBeGreaterThanOrEqual(2);
  });
});

describe("formatValue", () => {
  it("formats price-per-puff to 4 decimal places", () => {
    expect(formatValue(0.0041, "pricePerPuff")).toBe("$0.0041");
  });

  it("formats price to 2 decimal places", () => {
    expect(formatValue(19.9, "price")).toBe("$19.90");
  });

  it("returns N/A for missing values", () => {
    expect(formatValue(null, "price")).toBe("N/A");
    expect(formatValue(undefined, "puffCount")).toBe("N/A");
  });
});

describe("sanitizeVerdictHtml", () => {
  it("strips title/meta/head/link/style/script tags", () => {
    const dirty = `<title>Injected</title><meta name="description" content="x"><head><link rel="canonical" href="x"></head><style>.x{}</style><script>alert(1)</script><p>real content</p>`;
    const clean = sanitizeVerdictHtml(dirty);
    expect(clean).not.toContain("<title>");
    expect(clean).not.toContain("<meta");
    expect(clean).not.toContain("<link");
    expect(clean).not.toContain("<style>");
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("<p>real content</p>");
  });

  it("downgrades embedded <h1> to <h2> instead of stripping the text", () => {
    // Regression test: verdict content (~61% of rows) embeds its own <h1>,
    // which duplicated the page's real <h1> when left untouched.
    const clean = sanitizeVerdictHtml("<h1>STLTH vs Vice: Complete Comparison</h1><p>body</p>");
    expect(clean).not.toContain("<h1");
    expect(clean).toContain("<h2>STLTH vs Vice: Complete Comparison</h2>");
  });

  it("preserves attributes on the downgraded heading", () => {
    const clean = sanitizeVerdictHtml('<h1 class="foo">Title</h1>');
    expect(clean).toBe('<h2 class="foo">Title</h2>');
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeVerdictHtml("")).toBe("");
  });
});
