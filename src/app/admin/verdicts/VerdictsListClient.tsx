"use client";

import { useMemo, useState } from "react";
import type { ComparisonStatus } from "../../../../lib/comparisons";

export default function VerdictsListClient({
  comparisons,
}: {
  comparisons: ComparisonStatus[];
}) {
  const [query, setQuery] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return comparisons.filter((c) => {
      if (onlyEmpty && c.hasVerdict) return false;
      if (!q) return true;
      return (
        c.vendor1.toLowerCase().includes(q) ||
        c.vendor2.toLowerCase().includes(q) ||
        c.slug.includes(q)
      );
    });
  }, [comparisons, query, onlyEmpty]);

  return (
    <div>
      <div className="flex gap-4 items-center mb-4">
        <input
          type="text"
          placeholder="Search by vendor name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyEmpty}
            onChange={(e) => setOnlyEmpty(e.target.checked)}
          />
          Empty only
        </label>
      </div>

      <p className="text-xs text-gray-400 mb-2">
        Showing {filtered.length} of {comparisons.length}
      </p>

      <ul className="divide-y border rounded">
        {filtered.slice(0, 200).map((c) => (
          <li key={c.slug} className="flex items-center justify-between p-3">
            <a
              href={`/admin/verdicts/${c.slug}`}
              className="text-sm hover:underline"
            >
              {c.vendor1} vs {c.vendor2}
            </a>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                c.hasVerdict
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {c.hasVerdict ? "Has content" : "Empty"}
            </span>
          </li>
        ))}
      </ul>

      {filtered.length > 200 && (
        <p className="text-xs text-gray-400 mt-2">
          {filtered.length - 200} more — refine your search to see them.
        </p>
      )}
    </div>
  );
}
