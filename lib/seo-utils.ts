// src/lib/seo-utils.ts
// ============================================================
// SEO utilities — matches your exact Supabase product columns
// ============================================================

import { type Locale, localeTag } from "./i18n/locale";

/** Locale-aware CAD currency formatting — "$34.25" (en-CA) vs "34,25 $" (fr-CA). */
function formatCurrency(
  value: number,
  locale: Locale,
  fractionDigits = 2,
): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

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
  description?: string;
  description_fr?: string;
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

// ─── Truncate at a word boundary, adding an ellipsis ───
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  const trimmed = str.slice(0, max - 1);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + "…";
}

// ─── Format vendor slug to display name ───
export function formatVendorName(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Build SEO title ───
export function buildPageTitle(
  vendor1: string,
  vendor2: string,
  locale: Locale = "en",
): string {
  if (locale === "fr") {
    return `${vendor1} vs ${vendor2} | Comparaison de vapoteuses jetables Canada – New City Vapes`;
  }
  return `${vendor1} vs ${vendor2} | Disposable Vape Comparison Canada – New City Vapes`;
}

// ─── Build meta description ───
export function buildMetaDescription(
  vendor1: string,
  vendor2: string,
  winner?: string,
  locale: Locale = "en",
): string {
  if (locale === "fr") {
    const base = `Comparez ${vendor1} vs ${vendor2}, vapoteuses jetables, côte à côte. Découvrez laquelle l'emporte sur le nombre de bouffées, l'autonomie de la batterie, le prix, la capacité en ML, le prix par bouffée et plus encore.`;
    // compareProducts() always returns the literal "Tie" (never localized) as
    // the sentinel for no winner — the vendor name it returns otherwise needs
    // no translation either way.
    if (winner && winner !== "Tie") {
      return `${base} Notre comparaison désigne ${winner} comme grand gagnant.`;
    }
    return `${base} Trouvez la meilleure vapoteuse jetable au Canada.`;
  }

  const base = `Compare ${vendor1} vs ${vendor2} disposable vapes side-by-side. See which wins on puff count, battery life, price, ML capacity, price-per-puff, and more.`;
  if (winner && winner !== "Tie") {
    return `${base} Our comparison picks ${winner} as the overall winner.`;
  }
  return `${base} Find the best disposable vape in Canada.`;
}

// ─── Sanitize verdict HTML injected via dangerouslySetInnerHTML ───
// Strips <title>/<meta>/<head>/<link>/<style>/<script> (which previously
// caused duplicate title/meta tags in crawlers), and downgrades any embedded
// <h1> to <h2> — ~61% of the ~2,800 existing verdict rows embed their own
// <h1>, which would otherwise create a second (and sometimes contradictory,
// see the vendor-content-mismatch data quality issue) <h1> alongside the
// page's own.
export function sanitizeVerdictHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]*\/?>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<link[^>]*\/?>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");
}

// ─── Format values for display (matches your existing logic) ───
export function formatValue(
  value: number | string | null | undefined,
  key: string,
  locale: Locale = "en",
): string {
  const notAvailable = locale === "fr" ? "N/D" : "N/A";
  if (value === null || value === undefined || value === "") return notAvailable;
  const keysToFormatAsCurrency = ["price", "pricePerPuff", "pricePerML"];
  const floatVal =
    typeof value === "number" ? value : parseFloat(value as string);
  if (keysToFormatAsCurrency.includes(key)) {
    if (isNaN(floatVal)) return notAvailable;
    return key === "pricePerPuff"
      ? formatCurrency(floatVal, locale, 4)
      : formatCurrency(floatVal, locale, 2);
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
  locale: Locale = "en",
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const numFmt = (n: number) => n.toLocaleString(localeTag(locale));

  if (locale === "fr") {
    // Overall winner
    faqs.push({
      question: `Quelle vapoteuse jetable est la meilleure, ${vendor1} ou ${vendor2} ?`,
      answer:
        result.winner !== "tie"
          ? `Selon notre comparaison portant sur ${result.breakdown.length} critères, ${result.winnerName} l'emporte avec un score de ${Math.max(result.leftScore, result.rightScore)} à ${Math.min(result.leftScore, result.rightScore)}. La comparaison évalue le nombre de bouffées, la capacité en ML, l'autonomie de la batterie, le prix, le prix par bouffée, le prix par ML et le nombre de saveurs.`
          : `Notre comparaison portant sur ${result.breakdown.length} critères montre que ${vendor1} et ${vendor2} sont à égalité, chacune obtenant ${result.leftScore} points. Le meilleur choix dépend des critères qui comptent le plus pour vous.`,
    });

    // Puff count
    if (p1?.puffCount && p2?.puffCount) {
      const more = p1.puffCount > p2.puffCount ? vendor1 : vendor2;
      const moreVal = Math.max(p1.puffCount, p2.puffCount);
      const lessVal = Math.min(p1.puffCount, p2.puffCount);
      faqs.push({
        question: `Laquelle dure le plus longtemps, ${vendor1} ou ${vendor2} ?`,
        answer:
          p1.puffCount === p2.puffCount
            ? `${vendor1} et ${vendor2} offrent toutes deux ${numFmt(p1.puffCount)} bouffées; elles durent donc à peu près aussi longtemps.`
            : `${more} dure plus longtemps avec ${numFmt(moreVal)} bouffées, comparativement à ${numFmt(lessVal)} bouffées.`,
      });
    }

    // Price
    if (p1?.price && p2?.price) {
      const cheaper = p1.price < p2.price ? vendor1 : vendor2;
      const cheaperPrice = Math.min(p1.price, p2.price);
      const pricierPrice = Math.max(p1.price, p2.price);
      faqs.push({
        question: `Quelle est la différence de prix entre ${vendor1} et ${vendor2} ?`,
        answer:
          p1.price === p2.price
            ? `${vendor1} et ${vendor2} sont toutes deux au prix de ${formatCurrency(p1.price, locale)} CAD.`
            : `${cheaper} est plus abordable à ${formatCurrency(cheaperPrice, locale)} CAD, tandis que l'autre coûte ${formatCurrency(pricierPrice, locale)} CAD — un écart de ${formatCurrency(Math.abs(p1.price - p2.price), locale)} CAD.`,
      });
    }

    // Price per puff
    if (p1?.pricePerPuff && p2?.pricePerPuff) {
      const better = p1.pricePerPuff < p2.pricePerPuff ? vendor1 : vendor2;
      const betterVal = Math.min(p1.pricePerPuff, p2.pricePerPuff);
      const worseVal = Math.max(p1.pricePerPuff, p2.pricePerPuff);
      faqs.push({
        question: `Quelle vapoteuse jetable offre le meilleur prix par bouffée, ${vendor1} ou ${vendor2} ?`,
        answer: `${better} offre un meilleur rapport qualité-prix à ${formatCurrency(betterVal, locale, 4)} CAD par bouffée, comparativement à ${formatCurrency(worseVal, locale, 4)} CAD par bouffée.`,
      });
    }

    // Battery
    if (p1?.battery && p2?.battery) {
      const stronger = p1.battery > p2.battery ? vendor1 : vendor2;
      const strongerVal = Math.max(p1.battery, p2.battery);
      const weakerVal = Math.min(p1.battery, p2.battery);
      faqs.push({
        question: `Laquelle a la plus grosse batterie, ${vendor1} ou ${vendor2} ?`,
        answer:
          p1.battery === p2.battery
            ? `Les deux appareils partagent la même batterie de ${p1.battery} mAh.`
            : `${stronger} a une batterie plus puissante de ${strongerVal} mAh, comparativement à ${weakerVal} mAh.`,
      });
    }

    // Availability
    faqs.push({
      question: `Puis-je acheter les vapoteuses jetables ${vendor1} et ${vendor2} au Canada ?`,
      answer: `Oui, ${vendor1} et ${vendor2} sont toutes deux offertes en vente au Canada chez New City Vapes, avec livraison gratuite sur les commandes de 50 $ et plus.`,
    });

    return faqs;
  }

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
