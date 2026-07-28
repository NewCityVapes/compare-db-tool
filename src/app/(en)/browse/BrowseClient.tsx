"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ComparisonStatus } from "../../../../lib/comparisons";
import { formatUpdatedAt } from "../../../../lib/utils";
import { getDictionary, localizePath, type Locale } from "../../../../lib/i18n";

type SortMode = "brand" | "recent";

export default function BrowseClient({
  comparisons,
  locale = "en",
}: {
  comparisons: ComparisonStatus[];
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const comparePrefix = localizePath("/compare", locale);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("brand");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return comparisons;
    return comparisons.filter(
      (c) =>
        c.vendor1.toLowerCase().includes(q) ||
        c.vendor2.toLowerCase().includes(q) ||
        `${c.vendor1} vs ${c.vendor2}`.toLowerCase().includes(q),
    );
  }, [comparisons, query]);

  const isSearching = query.trim().length > 0;

  const recentList = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (!a.updatedAt && !b.updatedAt) return a.slug.localeCompare(b.slug);
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [filtered]);

  // Each pair is grouped under BOTH of its vendors (not just whichever one
  // sorts first in the canonical slug), so e.g. "Vice" shows every
  // comparison that includes Vice, not only the ones where Vice happens to
  // be vendor1 alphabetically.
  const groupedByBrand = useMemo(() => {
    const groups: Record<string, { slug: string; label: string }[]> = {};
    for (const c of filtered) {
      const label = `${c.vendor1} vs ${c.vendor2}`;
      for (const brand of [c.vendor1, c.vendor2]) {
        if (!groups[brand]) groups[brand] = [];
        groups[brand].push({ slug: c.slug, label });
      }
    }
    for (const brand of Object.keys(groups)) {
      groups[brand].sort((a, b) => a.label.localeCompare(b.label));
    }
    return groups;
  }, [filtered]);

  const sortedBrands = Object.keys(groupedByBrand).sort();

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.browse.searchPlaceholder}
          aria-label={dict.browse.searchPlaceholder}
          className="browse-search-input"
          style={{
            flex: "1 1 260px",
            padding: "10px 14px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        />

        {!isSearching && (
          <div
            role="group"
            aria-label="Sort comparisons"
            style={{ display: "flex", gap: "8px" }}
          >
            {(
              [
                { mode: "brand" as const, label: dict.browse.sortByBrand },
                {
                  mode: "recent" as const,
                  label: dict.browse.sortRecentlyUpdated,
                },
              ]
            ).map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                aria-pressed={sortMode === mode}
                style={{
                  padding: "8px 14px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border:
                    sortMode === mode
                      ? "1px solid #CB9D64"
                      : "1px solid #ddd",
                  background: sortMode === mode ? "#CB9D64" : "#fff",
                  color: sortMode === mode ? "#fff" : "#333",
                  cursor: "pointer",
                  fontWeight: sortMode === mode ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "#666" }}>{dict.browse.noMatches(query)}</p>
      )}

      {isSearching && filtered.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filtered
            .map((c) => ({ slug: c.slug, label: `${c.vendor1} vs ${c.vendor2}` }))
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((item) => (
              <li key={item.slug} style={{ marginBottom: "10px" }}>
                <Link
                  href={`${comparePrefix}/${item.slug}`}
                  className="text-[#CB9D64] hover:underline"
                  style={{ fontSize: "16px" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>
      )}

      {!isSearching && sortMode === "brand" && (
        <div>
          {sortedBrands.map((brand) => (
            <section key={brand} style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
                {brand}
              </h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {groupedByBrand[brand].map((item) => (
                  <li key={`${brand}-${item.slug}`} style={{ marginBottom: "8px" }}>
                    <Link
                      href={`${comparePrefix}/${item.slug}`}
                      className="text-[#CB9D64] hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!isSearching && sortMode === "recent" && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {recentList.map((c) => (
            <li
              key={c.slug}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
                paddingBottom: "10px",
                borderBottom: "1px solid #eee",
              }}
            >
              <Link
                href={`${comparePrefix}/${c.slug}`}
                className="text-[#CB9D64] hover:underline"
                style={{ fontSize: "16px" }}
              >
                {c.vendor1} vs {c.vendor2}
              </Link>
              <span style={{ fontSize: "13px", color: "#999", whiteSpace: "nowrap" }}>
                {c.updatedAt ? formatUpdatedAt(c.updatedAt, locale) : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
