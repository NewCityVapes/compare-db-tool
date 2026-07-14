import { getAllComparisonSlugs } from "../../../lib/comparisons";

export async function GET() {
  const allSlugs = await getAllComparisonSlugs();
  const today = new Date().toISOString().split("T")[0];

  // Sourced from the same valid-vendor-pair set as generateStaticParams and
  // /browse, so nothing is sitemapped without also being reachable via an
  // internal link, and nothing indexable is missing from the sitemap.
  const staticPages = [
    `<url>
      <loc>https://compare.newcityvapes.com</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>`,
    `<url>
      <loc>https://compare.newcityvapes.com/browse</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
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
