import type { DistributionStats } from "../../lib/priceStats";
import { percentCheaperThan } from "../../lib/priceStats";
import { getDictionary, type Locale } from "../../lib/i18n";

/**
 * Shows where a single product's price sits against the whole catalog's
 * distribution for that metric: a frequency histogram colored along the same
 * cheap-to-expensive gradient as the marker bar, with the bin containing
 * this product picked out at full opacity. Pure/presentational (no hooks),
 * so it renders equally well from the server-rendered comparison table and
 * from ClientOnlyRender's client-side swap view.
 *
 * `id` must be unique per instance on the page — it namespaces the SVG
 * gradient def so multiple bars (product1/product2 × puff/ml) don't collide
 * on one <linearGradient id>.
 */
export default function DistributionBar({
  id,
  stats,
  value,
  formatValue,
  locale = "en",
}: {
  id: string;
  stats: DistributionStats;
  value: number;
  formatValue: (v: number) => string;
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const { min, max, avg, bins } = stats;
  const range = max - min;
  const positionPct = range === 0 ? 50 : ((value - min) / range) * 100;
  const maxBin = Math.max(...bins, 1);
  const cheaperThan = percentCheaperThan(stats, value);
  const barWidth = 100 / bins.length;
  const gradientId = `price-gradient-${id}`;
  const markerBinIndex = Math.max(
    0,
    Math.min(bins.length - 1, Math.floor((positionPct / 100) * bins.length)),
  );

  const standingColor =
    cheaperThan >= 60 ? "#16a34a" : cheaperThan >= 40 ? "#d97706" : "#dc2626";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "300px",
        margin: "10px auto 0",
        background: "linear-gradient(180deg, #fafafa, #f3f4f6)",
        border: "1px solid #ececec",
        borderRadius: "12px",
        padding: "10px 12px 8px",
        boxSizing: "border-box",
      }}
    >
      <svg
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "30px", display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="100"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {bins.map((count, i) => {
          const h = (count / maxBin) * 27;
          const isMarkerBin = i === markerBinIndex;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.12}
              width={Math.max(0.4, barWidth * 0.76)}
              y={30 - h}
              height={h}
              rx={barWidth * 0.15}
              fill={`url(#${gradientId})`}
              opacity={isMarkerBin ? 1 : 0.35}
            />
          );
        })}
      </svg>

      <div style={{ position: "relative", height: "15px", marginTop: "4px" }}>
        <div
          style={{
            position: "absolute",
            top: "6px",
            left: 0,
            right: 0,
            height: "5px",
            borderRadius: "3px",
            background:
              "linear-gradient(to right, #22c55e, #eab308, #ef4444)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.18)",
          }}
        />
        <div
          role="img"
          aria-label={`${formatValue(value)} — ${dict.distribution.cheaperThan(cheaperThan)}`}
          title={`${formatValue(value)} — ${dict.distribution.cheaperThan(cheaperThan)}`}
          style={{
            position: "absolute",
            top: "1px",
            left: `${Math.max(2, Math.min(98, positionPct))}%`,
            transform: "translateX(-50%)",
            width: "13px",
            height: "13px",
            borderRadius: "50%",
            background: "#fff",
            border: `3px solid ${standingColor}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: "12.5px",
          fontWeight: 700,
          color: standingColor,
          marginTop: "5px",
        }}
      >
        {dict.distribution.cheaperThan(cheaperThan)}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10.5px",
          color: "#9ca3af",
          marginTop: "3px",
        }}
      >
        <span>{dict.distribution.min} {formatValue(min)}</span>
        <span>{dict.distribution.avg} {formatValue(avg)}</span>
        <span>{dict.distribution.max} {formatValue(max)}</span>
      </div>
    </div>
  );
}
