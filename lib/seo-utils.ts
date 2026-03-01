// src/lib/seo-utils.ts
// ============================================================
// SEO utilities — matches your exact Supabase product columns
// ============================================================

// ─── Your exact product shape from Supabase ───
export type Product = {
  id: string;
  title: string;
  vendor: string;
  price: number;
  puffCount?: number;
  ml?: number;
  battery?: number;
  imageUrl?: string;
  link?: string;
  pricePerPuff?: number;
  pricePerML?: number;
  numberOfFlavours?: number;
  features?: string;
  expertReview?: string;
  collectionHandle?: string;
};

// ─── Comparison result ───
export interface ComparisonResult {
  leftScore: number;
  rightScore: number;
  winner: "left" | "right" | "tie";
  winnerName: string;
  breakdown: {
    label: string;
    key: string;
    leftValue: number | null;
    rightValue: number | null;
    pointTo: "left" | "right" | null;
  }[];
}

/**
 * Points-based comparison matching your existing WinnerCell logic.
 * Higher is better: puffCount, ml, battery, numberOfFlavours
 * Lower is better: price, pricePerPuff, pricePerML
 */
export function compareProducts(
  p1: Product | null,
  p2: Product | null,
  vendor1Name: string,
  vendor2Name: string,
): ComparisonResult {
  const attributes = [
    { label: "PUFF COUNT", key: "puffCount" as keyof Product },
    { label: "ML", key: "ml" as keyof Product },
    { label: "BATTERY", key: "battery" as keyof Product },
    { label: "PRICE", key: "price" as keyof Product },
    { label: "PRICE PER PUFF", key: "pricePerPuff" as keyof Product },
    { label: "PRICE PER ML", key: "pricePerML" as keyof Product },
    { label: "NUMBER OF FLAVOURS", key: "numberOfFlavours" as keyof Product },
  ];

  const higherIsBetter = ["puffCount", "ml", "battery", "numberOfFlavours"];
  const lowerIsBetter = ["price", "pricePerPuff", "pricePerML"];

  let leftScore = 0;
  let rightScore = 0;
  const breakdown: ComparisonResult["breakdown"] = [];

  for (const attr of attributes) {
    const v1 = (p1?.[attr.key] as number) ?? null;
    const v2 = (p2?.[attr.key] as number) ?? null;
    let pointTo: "left" | "right" | null = null;

    if (v1 != null && v2 != null && v1 !== v2) {
      if (higherIsBetter.includes(attr.key)) {
        pointTo = v1 > v2 ? "left" : "right";
      } else if (lowerIsBetter.includes(attr.key)) {
        pointTo = v1 < v2 ? "left" : "right";
      }

      if (pointTo === "left") leftScore++;
      else if (pointTo === "right") rightScore++;
    }

    breakdown.push({
      label: attr.label,
      key: attr.key,
      leftValue: v1,
      rightValue: v2,
      pointTo,
    });
  }

  let winner: "left" | "right" | "tie" = "tie";
  let winnerName = "Tie";
  if (leftScore > rightScore) {
    winner = "left";
    winnerName = vendor1Name;
  } else if (rightScore > leftScore) {
    winner = "right";
    winnerName = vendor2Name;
  }

  return { leftScore, rightScore, winner, winnerName, breakdown };
}

// ─── Format vendor slug to display name ───
export function formatVendorName(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Build SEO title ───
export function buildPageTitle(vendor1: string, vendor2: string): string {
  return `${vendor1} vs ${vendor2} | Disposable Vape Comparison Canada – New City Vapes`;
}

// ─── Build meta description ───
export function buildMetaDescription(
  vendor1: string,
  vendor2: string,
  winner?: string,
): string {
  const base = `Compare ${vendor1} vs ${vendor2} disposable vapes side-by-side. See which wins on puff count, battery life, price, ML capacity, price-per-puff, and more.`;
  if (winner && winner !== "Tie") {
    return `${base} Our comparison picks ${winner} as the overall winner.`;
  }
  return `${base} Find the best disposable vape in Canada.`;
}

// ─── Format values for display (matches your existing logic) ───
export function formatValue(
  value: number | string | null | undefined,
  key: string,
): string {
  if (value === null || value === undefined || value === "") return "N/A";
  const keysToFormatAsCurrency = ["price", "pricePerPuff", "pricePerML"];
  const floatVal =
    typeof value === "number" ? value : parseFloat(value as string);
  if (keysToFormatAsCurrency.includes(key)) {
    if (key === "pricePerPuff") {
      return isNaN(floatVal) ? "N/A" : `$${floatVal.toFixed(4)}`;
    }
    return isNaN(floatVal) ? "N/A" : `$${floatVal.toFixed(2)}`;
  }
  return value.toString();
}

// ─── Generate FAQ items for schema + rendering ───
export function generateFAQs(
  p1: Product | null,
  p2: Product | null,
  vendor1: string,
  vendor2: string,
  result: ComparisonResult,
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];

  // Overall winner
  faqs.push({
    question: `Which is better, ${vendor1} or ${vendor2} disposable vapes?`,
    answer:
      result.winner !== "tie"
        ? `Based on our comparison across ${result.breakdown.length} attributes, ${result.winnerName} comes out ahead with a score of ${Math.max(result.leftScore, result.rightScore)} to ${Math.min(result.leftScore, result.rightScore)}. The comparison evaluates puff count, ML capacity, battery life, price, price-per-puff, price-per-ML, and number of flavours.`
        : `Our comparison across ${result.breakdown.length} attributes shows ${vendor1} and ${vendor2} are evenly matched, both scoring ${result.leftScore} points. The best choice depends on which specific attributes matter most to you.`,
  });

  // Puff count
  if (p1?.puffCount && p2?.puffCount) {
    const more = p1.puffCount > p2.puffCount ? vendor1 : vendor2;
    const moreVal = Math.max(p1.puffCount, p2.puffCount);
    const lessVal = Math.min(p1.puffCount, p2.puffCount);
    faqs.push({
      question: `Which lasts longer, ${vendor1} or ${vendor2}?`,
      answer:
        p1.puffCount === p2.puffCount
          ? `Both ${vendor1} and ${vendor2} offer ${p1.puffCount.toLocaleString()} puffs, so they last about the same amount of time.`
          : `${more} lasts longer with ${moreVal.toLocaleString()} puffs compared to ${lessVal.toLocaleString()} puffs.`,
    });
  }

  // Price
  if (p1?.price && p2?.price) {
    const cheaper = p1.price < p2.price ? vendor1 : vendor2;
    const cheaperPrice = Math.min(p1.price, p2.price);
    const pricierPrice = Math.max(p1.price, p2.price);
    faqs.push({
      question: `What is the price difference between ${vendor1} and ${vendor2}?`,
      answer:
        p1.price === p2.price
          ? `Both ${vendor1} and ${vendor2} are priced at $${p1.price.toFixed(2)} CAD.`
          : `${cheaper} is more affordable at $${cheaperPrice.toFixed(2)} CAD, while the other costs $${pricierPrice.toFixed(2)} CAD — a difference of $${Math.abs(p1.price - p2.price).toFixed(2)} CAD.`,
    });
  }

  // Price per puff
  if (p1?.pricePerPuff && p2?.pricePerPuff) {
    const better = p1.pricePerPuff < p2.pricePerPuff ? vendor1 : vendor2;
    const betterVal = Math.min(p1.pricePerPuff, p2.pricePerPuff);
    const worseVal = Math.max(p1.pricePerPuff, p2.pricePerPuff);
    faqs.push({
      question: `Which disposable vape has a better price per puff, ${vendor1} or ${vendor2}?`,
      answer: `${better} offers better value at $${betterVal.toFixed(4)} CAD per puff, compared to $${worseVal.toFixed(4)} CAD per puff.`,
    });
  }

  // Battery
  if (p1?.battery && p2?.battery) {
    const stronger = p1.battery > p2.battery ? vendor1 : vendor2;
    const strongerVal = Math.max(p1.battery, p2.battery);
    const weakerVal = Math.min(p1.battery, p2.battery);
    faqs.push({
      question: `Which has a bigger battery, ${vendor1} or ${vendor2}?`,
      answer:
        p1.battery === p2.battery
          ? `Both devices have the same ${p1.battery}mAh battery.`
          : `${stronger} has a larger ${strongerVal}mAh battery compared to ${weakerVal}mAh.`,
    });
  }

  // Availability
  faqs.push({
    question: `Can I buy ${vendor1} and ${vendor2} disposable vapes in Canada?`,
    answer: `Yes, both ${vendor1} and ${vendor2} disposable vapes are available for purchase in Canada from New City Vapes with free shipping on orders over $50.`,
  });

  return faqs;
}
