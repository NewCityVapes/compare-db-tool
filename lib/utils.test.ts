import { describe, it, expect } from "vitest";
import { toSlug, formatUpdatedAt } from "./utils";

describe("toSlug", () => {
  it("lowercases and collapses whitespace/punctuation into single dashes", () => {
    expect(toSlug("STLTH Titan Max")).toBe("stlth-titan-max");
  });

  it("strips apostrophes rather than replacing them with a dash", () => {
    expect(toSlug("Drip'n EVO Series 28K")).toBe("dripn-evo-series-28k");
  });

  it("trims leading/trailing dashes", () => {
    expect(toSlug("  STLTH!  ")).toBe("stlth");
  });
});

describe("formatUpdatedAt", () => {
  it("omits the year for dates in the current year", () => {
    const thisYear = new Date().getFullYear();
    const formatted = formatUpdatedAt(`${thisYear}-07-24T12:00:00.000Z`);
    expect(formatted).not.toContain(String(thisYear));
  });

  it("includes the year for dates in a past year", () => {
    const formatted = formatUpdatedAt("2020-07-24T12:00:00.000Z");
    expect(formatted).toContain("2020");
  });
});
