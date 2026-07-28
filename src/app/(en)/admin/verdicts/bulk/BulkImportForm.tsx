"use client";

import { useState } from "react";

const PLACEHOLDER = `[
  {
    "vendor1": "STLTH",
    "vendor2": "Vice",
    "content": "<section><h2>Summary</h2><p>...</p></section>"
  }
]`;

export default function BulkImportForm() {
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    setStatus("");

    let items: unknown;
    try {
      items = JSON.parse(raw);
    } catch {
      setStatus("❌ That isn't valid JSON — check for a trailing comma or unescaped quote.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/verdicts/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setStatus(`✅ Saved ${data.count} verdicts — live within a few seconds.`);
        setRaw("");
      } else {
        setStatus("❌ " + (data?.error || "Import failed"));
      }
    } catch {
      setStatus("❌ An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={20}
        placeholder={PLACEHOLDER}
        className="w-full p-3 border rounded font-mono text-sm"
      />
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleSubmit}
          disabled={saving || !raw.trim()}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Importing…" : "Import"}
        </button>
        {status && <p className="text-sm">{status}</p>}
      </div>
    </div>
  );
}
