import type { DistributionStats } from "../../lib/priceStats";
import { percentCheaperThan } from "../../lib/priceStats";

/**
 * Shows where a single product's price sits against the whole catalog's
 * distribution for that metric: a frequency histogram, a cheap-to-expensive
 * gradient bar, and a marker at this product's position. Pure/presentational
 * (no hooks) so it renders equally well from the server-rendered comparison
 * table and from ClientOnlyRender's client-side swap view.
 */
export default function DistributionBar({
  stats,
  value,
  formatValue,
}: {
  stats: DistributionStats;
  value: number;
  formatValue: (v: number) => string;
}) {
  const { min, max, avg, bins } = stats;
  const range = max - min;
  const positionPct =
    range === 0 ? 50 : ((value - min) / range) * 100;
  const maxBin = Math.max(...bins, 1);
  const cheaperThan = percentCheaperThan(stats, value);
  const barWidth = 100 / bins.length;

  return (
    <div style={{ width: "100%", maxWidth: "300px", margin: "10px auto 0" }}>
      <svg
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "28px", display: "block" }}
        aria-hidden="true"
      >
        {bins.map((count, i) => {
          const h = (count / maxBin) * 26;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.1}
              width={barWidth * 0.8}
              y={28 - h}
              height={h}
              fill="#d1d5db"
            />
          );
        })}
      </svg>

      <div style={{ position: "relative", height: "10px", marginTop: "2px" }}>
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: 0,
            right: 0,
            height: "4px",
            borderRadius: "2px",
            background:
              "linear-gradient(to right, #22c55e, #eab308, #ef4444)",
          }}
        />
        <div
          role="img"
          aria-label={`${formatValue(value)}, cheaper than approximately ${cheaperThan}% of products`}
          title={`${formatValue(value)} — cheaper than ~${cheaperThan}% of products`}
          style={{
            position: "absolute",
            top: 0,
            left: `${Math.max(1, Math.min(99, positionPct))}%`,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "8px solid #2E323B",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#999",
          marginTop: "2px",
        }}
      >
        <span>Min: {formatValue(min)}</span>
        <span>Avg: {formatValue(avg)}</span>
        <span>Max: {formatValue(max)}</span>
      </div>
      <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
        Cheaper than ~{cheaperThan}% of products
      </div>
    </div>
  );
}
