// src/app/admin/dashboard/page.tsx
"use client";

import { useState } from "react";

export default function AdminDashboardPage() {
  const [status, setStatus] = useState("");

  async function handleSync() {
    setStatus("⏳ Syncing...");

    try {
      const res = await fetch("/api/sync-shopify", {
        method: "POST",
        credentials: "include", // ✅ important to include session cookie
      });

      let data = null;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Sync failed", err);
        setStatus("❌ An unexpected error occurred");
      }

      if (res.ok) {
        setStatus("✅ Sync complete");
      } else {
        setStatus("❌ " + (data?.error || "Sync failed"));
      }
    } catch (err) {
      console.error("Sync failed", err);
      setStatus("❌ An unexpected error occurred");
    }
  }

  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">🛠 Admin Dashboard</h1>
      <button
        onClick={handleSync}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Sync Shopify Products
      </button>
      {status && <p className="mt-4 text-red-500">{status}</p>}
    </main>
  );
}
