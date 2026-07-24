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
  it("always includes the year, current or past", () => {
    const thisYear = new Date().getFullYear();
    expect(formatUpdatedAt(`${thisYear}-07-24T12:00:00.000Z`)).toContain(
      String(thisYear),
    );
    expect(formatUpdatedAt("2020-07-24T12:00:00.000Z")).toContain("2020");
  });
});
