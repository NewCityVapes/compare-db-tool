import { supabase } from "../../../lib/supabase.mjs";

export async function GET() {
  const allSlugs: string[] = [];

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

  const today = new Date().toISOString().split("T")[0];

  // ✅ FIX: Include browse page so it's discoverable
  const staticPages = [
    `<url>
      <loc>https://compare.newcityvapes.com/browse</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>`,
  ];

  const comparisonPages = allSlugs.map(
    (slug) =>
      `<url>
      <loc>https://compare.newcityvapes.com/compare/${slug}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.join("\n  ")}
  ${comparisonPages.join("\n  ")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
