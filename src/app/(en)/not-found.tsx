// src/app/not-found.tsx
// ============================================================
// Custom 404 — returns proper 404 status to Google
// ============================================================

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4" style={{ color: "#2E323B" }}>
        Comparison Not Found
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        The vape comparison you&apos;re looking for doesn&apos;t exist or may
        have been moved. Try browsing our full list of comparisons.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="https://compare.newcityvapes.com"
          className="px-6 py-3 rounded-lg font-bold text-white"
          style={{ backgroundColor: "#CB9D64" }}
        >
          Browse Comparisons
        </Link>
        <Link
          href="https://newcityvapes.com"
          className="px-6 py-3 border-2 rounded-lg font-bold"
          style={{ borderColor: "#CB9D64", color: "#CB9D64" }}
        >
          Go to Shop
        </Link>
      </div>
    </main>
  );
}
