"use client";

import { useState } from "react";
import RichTextEditor from "./RichTextEditor";
import FrenchVerdictPanel from "./FrenchVerdictPanel";
import type { FrenchStatus } from "../../../../../../lib/comparisons";

export default function VerdictEditForm({
  slug,
  vendor1,
  vendor2,
  initialContent,
  initialContentFr,
  initialFrStatus,
}: {
  slug: string;
  vendor1: string;
  vendor2: string;
  initialContent: string;
  initialContentFr: string;
  initialFrStatus: FrenchStatus;
}) {
  const [tab, setTab] = useState<"en" | "fr">("en");
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [indexStatus, setIndexStatus] = useState("");
  const [indexing, setIndexing] = useState(false);

  async function handleSave() {
    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/verdicts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor1, vendor2, content }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setStatus("✅ Saved — live within a few seconds.");
      } else {
        setStatus("❌ " + (data?.error || "Save failed"));
      }
    } catch {
      setStatus("❌ An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForIndexing() {
    setIndexing(true);
    setIndexStatus("");

    try {
      const res = await fetch("/api/admin/submit-indexing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://compare.newcityvapes.com/compare/${slug}`,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setIndexStatus("✅ Submitted to Google for indexing.");
      } else {
        setIndexStatus("❌ " + (data?.error || "Submission failed"));
      }
    } catch {
      setIndexStatus("❌ An unexpected error occurred");
    } finally {
      setIndexing(false);
    }
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm border-b-2 -mb-px ${
      active
        ? "border-black font-semibold"
        : "border-transparent text-gray-500 hover:text-black"
    }`;

  return (
    <div>
      <div className="flex border-b mb-4">
        <button className={tabClass(tab === "en")} onClick={() => setTab("en")}>
          English
        </button>
        <button className={tabClass(tab === "fr")} onClick={() => setTab("fr")}>
          Français
        </button>
      </div>

      {/* Both tabs stay mounted so switching never loses unsaved edits. */}
      <div className={tab === "fr" ? "hidden" : ""}>
      <RichTextEditor value={content} onChange={setContent} />
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {status && <p className="text-sm">{status}</p>}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={handleSubmitForIndexing}
          disabled={indexing}
          className="border border-gray-400 text-gray-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-50"
        >
          {indexing ? "Submitting…" : "Submit to Google for Indexing"}
        </button>
        {indexStatus && <p className="text-sm">{indexStatus}</p>}
      </div>
      </div>

      <div className={tab === "en" ? "hidden" : ""}>
        <FrenchVerdictPanel
          slug={slug}
          vendor1={vendor1}
          vendor2={vendor2}
          englishContent={content}
          initialContentFr={initialContentFr}
          initialStatus={initialFrStatus}
        />
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Slug: <code>{slug}</code>
      </p>
    </div>
  );
}
