import { getAllComparisonSlugs } from "../../../lib/comparisons";

function hreflangLinks(enUrl: string, frUrl: string): string {
  return `
      <xhtml:link rel="alternate" hreflang="en-CA" href="${enUrl}" />
      <xhtml:link rel="alternate" hreflang="fr-CA" href="${frUrl}" />`;
}

export async function GET() {
  const allSlugs = await getAllComparisonSlugs();
  const today = new Date().toISOString().split("T")[0];

  // Sourced from the same valid-vendor-pair set as generateStaticParams and
  // /browse, so nothing is sitemapped without also being reachable via an
  // internal link, and nothing indexable is missing from the sitemap. Each
  // English URL carries hreflang links to its /fr counterpart and vice
  // versa, matching the alternates.languages set in each page's metadata.
  const staticPages = [
    {
      en: "https://compare.newcityvapes.com",
      fr: "https://compare.newcityvapes.com/fr",
      priority: "1.0",
      changefreq: "weekly",
    },
    {
      en: "https://compare.newcityvapes.com/browse",
      fr: "https://compare.newcityvapes.com/fr/browse",
      priority: "0.9",
      changefreq: "daily",
    },
  ];

  const staticUrls = staticPages.flatMap(({ en, fr, priority, changefreq }) => [
    `<url>
      <loc>${en}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>${hreflangLinks(en, fr)}
    </url>`,
    `<url>
      <loc>${fr}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>${hreflangLinks(en, fr)}
    </url>`,
  ]);

  const comparisonPages = allSlugs.flatMap((slug) => {
    const en = `https://compare.newcityvapes.com/compare/${slug}`;
    const fr = `https://compare.newcityvapes.com/fr/compare/${slug}`;
    return [
      `<url>
      <loc>${en}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>${hreflangLinks(en, fr)}
    </url>`,
      `<url>
      <loc>${fr}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>${hreflangLinks(en, fr)}
    </url>`,
    ];
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${staticUrls.join("\n  ")}
  ${comparisonPages.join("\n  ")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
