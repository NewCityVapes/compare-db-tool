import { describe, it, expect } from "vitest";
import {
  verdictSlugCandidates,
  pickVerdictContent,
  productsForVendorSlug,
} from "./comparisons";
import type { Product } from "./seo-utils";

function makeProduct(vendor: string, title: string): Product {
  return { id: title, title, vendor, price: 10 };
}

describe("verdictSlugCandidates", () => {
  it("puts the canonical slug first", () => {
    const candidates = verdictSlugCandidates("STLTH", "Vice", "stlth-vs-vice");
    expect(candidates[0]).toBe("stlth-vs-vice");
  });

  it("includes both orderings under the legacy (punctuation-preserving) slugifier", () => {
    const candidates = verdictSlugCandidates(
      "Drip'n EVO Series 28K",
      "Elf Bar BC10000",
      "dripn-evo-series-28k-vs-elf-bar-bc10000",
    );
    expect(candidates).toContain("drip'n-evo-series-28k-vs-elf-bar-bc10000");
    expect(candidates).toContain("elf-bar-bc10000-vs-drip'n-evo-series-28k");
  });

  it("de-duplicates when both slugifiers agree", () => {
    const candidates = verdictSlugCandidates("STLTH", "Vice", "stlth-vs-vice");
    expect(new Set(candidates).size).toBe(candidates.length);
  });
});

describe("pickVerdictContent", () => {
  it("prefers the canonical slug when multiple rows match", () => {
    const content = pickVerdictContent(
      [
        { slug: "vice-vs-stlth", content: "legacy reverse content" },
        { slug: "stlth-vs-vice", content: "canonical content" },
      ],
      ["stlth-vs-vice", "vice-vs-stlth"],
    );
    expect(content).toBe("canonical content");
  });

  it("falls back to a legacy row when the canonical slug has none", () => {
    const content = pickVerdictContent(
      [{ slug: "drip'n-evo-series-28k-vs-elf-bar-bc10000", content: "legacy content" }],
      [
        "dripn-evo-series-28k-vs-elf-bar-bc10000",
        "elf-bar-bc10000-vs-dripn-evo-series-28k",
        "drip'n-evo-series-28k-vs-elf-bar-bc10000",
      ],
    );
    expect(content).toBe("legacy content");
  });

  it("returns null when nothing matches", () => {
    expect(pickVerdictContent([], ["a-vs-b"])).toBeNull();
  });
});

describe("productsForVendorSlug", () => {
  it("matches vendor names with punctuation stripped from the slug", () => {
    // Regression test: reconstructing "dripn evo series 28k" from the slug
    // and `ilike`-matching it against the real vendor value never matches,
    // because the stripped apostrophe can't be reconstructed. Re-slugifying
    // each row's real vendor value and comparing slug-to-slug does match.
    const products = [
      makeProduct("Drip'n EVO Series 28K", "Drip'n EVO 28K Mint"),
      makeProduct("STLTH", "STLTH 3K"),
    ];

    const matches = productsForVendorSlug(products, "dripn-evo-series-28k");

    expect(matches).toHaveLength(1);
    expect(matches[0].vendor).toBe("Drip'n EVO Series 28K");
  });

  it("sorts matches alphabetically by title", () => {
    const products = [
      makeProduct("STLTH", "STLTH Zeta"),
      makeProduct("STLTH", "STLTH Alpha"),
    ];

    const matches = productsForVendorSlug(products, "stlth");

    expect(matches.map((p) => p.title)).toEqual(["STLTH Alpha", "STLTH Zeta"]);
  });

  it("returns an empty array when no vendor matches", () => {
    expect(productsForVendorSlug([makeProduct("STLTH", "X")], "vice")).toEqual(
      [],
    );
  });
});
