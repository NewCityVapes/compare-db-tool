import type { Product } from "./seo-utils";

const BIN_COUNT = 40;

export interface DistributionStats {
  min: number;
  max: number;
  avg: number;
  bins: number[];
  total: number;
}

function buildDistribution(values: number[]): DistributionStats | null {
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  const bins = new Array(BIN_COUNT).fill(0);
  const range = max - min;
  for (const v of values) {
    const idx =
      range === 0
        ? 0
        : Math.min(BIN_COUNT - 1, Math.floor(((v - min) / range) * BIN_COUNT));
    bins[idx]++;
  }

  return { min, max, avg, bins, total: values.length };
}

/**
 * Catalog-wide price-per-puff / price-per-ml distributions, computed once
 * from every disposable product with a valid value for that metric. Powers
 * the "where does this price sit against everything else we sell" bar on
 * comparison pages. Independent of which two vendors are being compared, so
 * callers compute it once per page load and reuse it for both products.
 */
export function getPriceDistributions(products: Product[]): {
  pricePerPuff: DistributionStats | null;
  pricePerML: DistributionStats | null;
} {
  const puffValues = products
    .map((p) => p.pricePerPuff)
    .filter(
      (v): v is number => v != null && v > 0 && Number.isFinite(v),
    );
  const mlValues = products
    .map((p) => p.pricePerML)
    .filter(
      (v): v is number => v != null && v > 0 && Number.isFinite(v),
    );

  return {
    pricePerPuff: buildDistribution(puffValues),
    pricePerML: buildDistribution(mlValues),
  };
}

function binIndexForValue(stats: DistributionStats, value: number): number {
  const { min, max, bins } = stats;
  if (max === min) return 0;
  const idx = Math.floor(((value - min) / (max - min)) * bins.length);
  return Math.max(0, Math.min(bins.length - 1, idx));
}

/**
 * Approximate percentage of the catalog this value beats on price (lower is
 * better). Uses the histogram bins rather than the raw value list, since the
 * bins are small enough to ship to the client as a prop while the full
 * per-product value list isn't.
 */
export function percentCheaperThan(
  stats: DistributionStats,
  value: number,
): number {
  if (stats.total === 0) return 0;
  const idx = binIndexForValue(stats, value);
  let below = 0;
  for (let i = 0; i < idx; i++) below += stats.bins[i];
  below += stats.bins[idx] / 2;
  const higher = stats.total - below;
  return Math.max(0, Math.min(100, Math.round((higher / stats.total) * 100)));
}
