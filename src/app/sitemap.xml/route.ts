import { supabase } from "../../../lib/supabase.mjs"; // adjust path if needed

export async function GET() {
  const { data: verdicts, error } = await supabase
    .from("verdicts")
    .select("slug");

  if (error || !verdicts) {
    console.error(
      "❌ Error fetching verdict slugs for sitemap:",
      error?.message
    );
    return new Response("Error generating sitemap", { status: 500 });
  }

  const urls = verdicts.map(
    ({ slug }) =>
      `<url><loc>https://compare.newcityvapes.com/compare/${slug}</loc></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
