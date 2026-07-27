import { describe, it, expect } from "vitest";
import { getPriceDistributions, percentCheaperThan } from "./priceStats";
import type { Product } from "./seo-utils";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    title: "Test Vape",
    vendor: "Test Vendor",
    price: 20,
    ...overrides,
  };
}

describe("getPriceDistributions", () => {
  it("computes min/max/avg from valid pricePerPuff values, ignoring null/zero", () => {
    const products = [
      makeProduct({ pricePerPuff: 0.002 }),
      makeProduct({ pricePerPuff: 0.004 }),
      makeProduct({ pricePerPuff: 0.006 }),
      makeProduct({ pricePerPuff: 0 }),
      makeProduct({ pricePerPuff: undefined }),
    ];

    const { pricePerPuff } = getPriceDistributions(products);

    expect(pricePerPuff).not.toBeNull();
    expect(pricePerPuff!.min).toBeCloseTo(0.002);
    expect(pricePerPuff!.max).toBeCloseTo(0.006);
    expect(pricePerPuff!.avg).toBeCloseTo(0.004);
    expect(pricePerPuff!.total).toBe(3);
  });

  it("returns null when no product has a valid value", () => {
    const products = [makeProduct({ pricePerPuff: undefined })];
    const { pricePerPuff, pricePerML } = getPriceDistributions(products);
    expect(pricePerPuff).toBeNull();
    expect(pricePerML).toBeNull();
  });

  it("bins sum to the total count of valid values", () => {
    const products = Array.from({ length: 25 }, (_, i) =>
      makeProduct({ pricePerML: 1 + i * 0.1 }),
    );
    const { pricePerML } = getPriceDistributions(products);
    const binSum = pricePerML!.bins.reduce((a, b) => a + b, 0);
    expect(binSum).toBe(25);
  });
});

describe("percentCheaperThan", () => {
  it("gives the cheapest value close to 100% and the priciest close to 0%", () => {
    const products = Array.from({ length: 100 }, (_, i) =>
      makeProduct({ pricePerPuff: i + 1 }),
    );
    const { pricePerPuff } = getPriceDistributions(products);

    const cheap = percentCheaperThan(pricePerPuff!, 1);
    const expensive = percentCheaperThan(pricePerPuff!, 100);

    expect(cheap).toBeGreaterThan(expensive);
    expect(cheap).toBeGreaterThanOrEqual(90);
    expect(expensive).toBeLessThanOrEqual(10);
  });

  it("returns 0 when the distribution has no values", () => {
    const products = [makeProduct({ pricePerPuff: undefined })];
    const { pricePerPuff } = getPriceDistributions(products);
    expect(pricePerPuff).toBeNull();
  });
});
