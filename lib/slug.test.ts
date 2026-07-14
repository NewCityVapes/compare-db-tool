import { describe, it, expect } from "vitest";
import { canonicalizeSlug, isCanonicalSlug, parseCompareSlug } from "./slug";

describe("canonicalizeSlug", () => {
  it("is order-independent", () => {
    expect(canonicalizeSlug("STLTH", "Vice")).toBe(
      canonicalizeSlug("Vice", "STLTH"),
    );
  });

  it("is case-insensitive", () => {
    expect(canonicalizeSlug("stlth", "VICE")).toBe(
      canonicalizeSlug("STLTH", "vice"),
    );
  });

  it("produces vendor1-vs-vendor2 in alphabetical order", () => {
    expect(canonicalizeSlug("Vice", "STLTH")).toBe("stlth-vs-vice");
  });

  it("slugifies special characters consistently", () => {
    expect(canonicalizeSlug("Lost Mary's", "Elf Bar")).toBe(
      canonicalizeSlug("lost marys", "elf bar"),
    );
  });
});

describe("isCanonicalSlug", () => {
  it("is true only for the alphabetical order", () => {
    expect(isCanonicalSlug("stlth-vs-vice", "stlth", "vice")).toBe(true);
    expect(isCanonicalSlug("vice-vs-stlth", "stlth", "vice")).toBe(false);
  });
});

describe("parseCompareSlug", () => {
  it("splits on the first -vs- occurrence", () => {
    expect(parseCompareSlug("stlth-vs-vice")).toEqual({
      vendor1Slug: "stlth",
      vendor2Slug: "vice",
    });
  });

  it("returns null when there is no -vs- separator", () => {
    expect(parseCompareSlug("stlth")).toBeNull();
  });

  it("returns null when either side is empty", () => {
    expect(parseCompareSlug("-vs-vice")).toBeNull();
    expect(parseCompareSlug("stlth-vs-")).toBeNull();
  });
});
