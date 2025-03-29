"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase-browser"; // uses anon key
import { v4 as uuidv4 } from "uuid"; // 👈 Add this at the top with your imports

export default function VerdictCMS() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [vendor1, setVendor1] = useState("");
  const [vendor2, setVendor2] = useState("");
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchVendors() {
      const { data } = await supabase
        .from("products")
        .select("vendor")
        .neq("vendor", "")
        .order("vendor", { ascending: true });

      if (data) {
        const uniqueVendors = Array.from(new Set(data.map((p) => p.vendor)));
        setVendors(uniqueVendors);
      }
    }

    fetchVendors();
  }, []);

  useEffect(() => {
    async function loadExistingVerdict() {
      if (vendor1 && vendor2) {
        const slug = `${toSlug(vendor1)}-vs-${toSlug(vendor2)}`;
        const { data } = await supabase
          .from("verdicts")
          .select("content")
          .eq("slug", slug)
          .single();

        if (data) setVerdict(data.content);
        else setVerdict("");
      }
    }

    loadExistingVerdict();
  }, [vendor1, vendor2]);

  function toSlug(str: string) {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  async function handleSave() {
    setLoading(true);

    const slug = `${toSlug(vendor1)}-vs-${toSlug(vendor2)}`;

    const { error } = await supabase.from("verdicts").upsert([
      {
        id: uuidv4(), // 👈 ensures no NULL id errors
        slug,
        vendor1,
        vendor2,
        content: verdict,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(
        "❌ Supabase insert error:",
        JSON.stringify(error, null, 2)
      );
      setMessage("❌ Error saving verdict: " + error.message);
    } else {
      setMessage("✅ Verdict saved!");
    }

    setTimeout(() => setMessage(""), 3000);
  }
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Verdict CMS ✍️</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Vendor 1:</label>
        <select
          className="w-full border p-2 rounded"
          value={vendor1}
          onChange={(e) => setVendor1(e.target.value)}
        >
          <option value="">Select a vendor</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Vendor 2:</label>
        <select
          className="w-full border p-2 rounded"
          value={vendor2}
          onChange={(e) => setVendor2(e.target.value)}
        >
          <option value="">Select a vendor</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Verdict:</label>
        <textarea
          className="w-full border p-2 rounded min-h-[200px]"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
        />
      </div>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={handleSave}
        disabled={loading || !vendor1 || !vendor2}
      >
        {loading ? "Saving..." : "Save Verdict"}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
