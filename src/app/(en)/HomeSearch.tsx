"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, localizePath, type Locale } from "../../../lib/i18n";

interface SearchableComparison {
  slug: string;
  vendor1: string;
  vendor2: string;
}

export default function HomeSearch({
  comparisons,
  locale = "en",
}: {
  comparisons: SearchableComparison[];
  locale?: Locale;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const comparePrefix = localizePath("/compare", locale);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return comparisons
      .filter(
        (c) =>
          c.vendor1.toLowerCase().includes(q) ||
          c.vendor2.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [comparisons, query]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", maxWidth: "480px", margin: "0 auto" }}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={dict.home.searchPlaceholder}
        aria-label={dict.home.searchPlaceholder}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      />

      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            listStyle: "none",
            margin: 0,
            padding: "6px",
            zIndex: 20,
            textAlign: "left",
          }}
        >
          {suggestions.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => router.push(`${comparePrefix}/${c.slug}`)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  color: "#333",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f7f4ef")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                {c.vendor1} vs {c.vendor2}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length > 0 && suggestions.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "14px",
            color: "#999",
            zIndex: 20,
          }}
        >
          {dict.home.noResults(query)}
        </div>
      )}
    </div>
  );
}
