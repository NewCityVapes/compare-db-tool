"use client";

import { useState } from "react";
import RichTextEditor from "./RichTextEditor";
import type { FrenchStatus } from "../../../../../../lib/comparisons";

const STATUS_BANNER: Record<FrenchStatus, { text: string; cls: string } | null> = {
  "n/a": {
    text: "There's no English verdict yet — write the English version first, then translate it.",
    cls: "bg-gray-100 text-gray-700",
  },
  missing: {
    text: "No French version yet. Use “Translate with AI” for a first draft, or write it yourself.",
    cls: "bg-amber-50 text-amber-900",
  },
  outdated: {
    text: "The English was edited after this French was saved, so the French may be out of date. Re-translate, or edit it and save to mark it current.",
    cls: "bg-amber-50 text-amber-900",
  },
  current: null,
};

export default function FrenchVerdictPanel({
  slug,
  vendor1,
  vendor2,
  englishContent,
  initialContentFr,
  initialStatus,
}: {
  slug: string;
  vendor1: string;
  vendor2: string;
  /** Live English text from the other tab (may include unsaved edits). */
  englishContent: string;
  initialContentFr: string;
  initialStatus: FrenchStatus;
}) {
  const [contentFr, setContentFr] = useState(initialContentFr);
  // The editor doesn't follow outside changes, so a new draft remounts it.
  const [editorVersion, setEditorVersion] = useState(0);
  const [status, setStatus] = useState<FrenchStatus>(initialStatus);
  const [message, setMessage] = useState("");
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [indexMessage, setIndexMessage] = useState("");
  const [indexing, setIndexing] = useState(false);

  const hasEnglish = englishContent.trim().length > 0;
  const banner = STATUS_BANNER[status];

  async function handleTranslate() {
    if (
      contentFr.trim() &&
      !window.confirm(
        "This replaces the French text currently in the editor with a new AI draft. Nothing is saved until you click Save French. Continue?",
      )
    ) {
      return;
    }

    setTranslating(true);
    setMessage("");
    try {
      const res = await fetch("/api/verdicts/translate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: englishContent }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.contentFr) {
        setContentFr(data.contentFr);
        setEditorVersion((v) => v + 1);
        setMessage(
          "✏️ AI draft ready — read it through, fix anything you want, then click Save French. Not saved yet.",
        );
      } else {
        setMessage("❌ " + (data?.error || "Translation failed"));
      }
    } catch {
      setMessage("❌ An unexpected error occurred");
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/verdicts/fr", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor1, vendor2, contentFr }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStatus("current");
        setMessage("✅ French saved — live within a few seconds.");
      } else {
        setMessage("❌ " + (data?.error || "Save failed"));
      }
    } catch {
      setMessage("❌ An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForIndexing() {
    setIndexing(true);
    setIndexMessage("");
    try {
      const res = await fetch("/api/admin/submit-indexing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://compare.newcityvapes.com/fr/compare/${slug}`,
        }),
      });
      const data = await res.json().catch(() => null);
      setIndexMessage(
        res.ok
          ? "✅ Submitted to Google for indexing."
          : "❌ " + (data?.error || "Submission failed"),
      );
    } catch {
      setIndexMessage("❌ An unexpected error occurred");
    } finally {
      setIndexing(false);
    }
  }

  return (
    <div>
      {banner && (
        <p className={`text-sm rounded px-3 py-2 mb-3 ${banner.cls}`}>
          {banner.text}
        </p>
      )}

      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={handleTranslate}
          disabled={translating || !hasEnglish}
          className="border border-blue-600 text-blue-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-50"
        >
          {translating ? "Translating… (can take a minute)" : "Translate with AI"}
        </button>
        <a
          href={`/fr/compare/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          View French page ↗
        </a>
      </div>

      <RichTextEditor
        key={editorVersion}
        value={contentFr}
        onChange={setContentFr}
      />

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleSave}
          disabled={saving || !contentFr.trim()}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save French"}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={handleSubmitForIndexing}
          disabled={indexing}
          className="border border-gray-400 text-gray-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-50"
        >
          {indexing ? "Submitting…" : "Submit French page to Google"}
        </button>
        {indexMessage && <p className="text-sm">{indexMessage}</p>}
      </div>
    </div>
  );
}
