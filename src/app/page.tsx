import { redirect } from "next/navigation";
import type { Metadata } from "next";

// ✅ FIX: Proper metadata for the homepage in case crawlers hit it before redirect
export const metadata: Metadata = {
  title: "Disposable Vape Comparison Tool | New City Vapes",
  description:
    "Compare disposable vapes side-by-side across top Canadian brands. Puff count, price, battery and more.",
  alternates: {
    canonical: "https://compare.newcityvapes.com",
  },
};

// ✅ FIX: Server-side redirect instead of client-side useEffect redirect
// This returns a proper 307/308 instead of rendering an empty page that Ahrefs flags
// as "H1 missing", "Low word count", and "3XX redirect"
export default function HomePage() {
  redirect("/compare/STLTH%20TITAN%20MAX%20DISPOSABLE-vs-VICE%20BOX%202");
}
