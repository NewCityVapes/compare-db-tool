// src/app/sitemap.xml/route.ts
// ============================================================
// CHANGES: Added lastmod, changefreq, priority for better crawling
// Added homepage and /compare hub page
// ============================================================

import { supabase } from "../../../lib/supabase.mjs";

export async function GET() {
  const allSlugs: string[] = [];
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let from = 0;
  let to = 999;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("verdicts")
      .select("slug")
      .range(from, to);

    if (error) {
      console.error(
        "❌ Error fetching verdict slugs for sitemap:",
        error.message,
      );
      return new Response("Error generating sitemap", { status: 500 });
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allSlugs.push(...data.map((d: { slug: string }) => d.slug));
      from += 1000;
      to += 1000;
    }
  }

  const comparisonUrls = allSlugs
    .map(
      (slug) =>
        `<url>
      <loc>https://compare.newcityvapes.com/compare/${slug}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`,
    )
    .join("\n    ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://compare.newcityvapes.com</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>
    ${comparisonUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
