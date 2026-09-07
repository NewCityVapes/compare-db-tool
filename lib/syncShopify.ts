// lib/syncShopify.ts

// Matches the page size already used to fetch from Shopify. Keeps each
// upsert's parameter count well clear of Postgres's per-statement bind
// limit — a catalog with several thousand SKUs (this one has: 20-30
// separate flavour rows per vendor) sent as one unbatched upsert risks
// hitting that limit or a request-size/timeout ceiling and failing the
// whole sync, or worse, only some rows landing depending on where the
// batch boundary falls upstream.
const UPSERT_BATCH_SIZE = 250;

export async function syncShopifyProducts(log = false) {
  const timestamp = new Date().toISOString();
  if (log) console.log(`\n🕒 Running Shopify Sync at ${timestamp}`);

  const { fetchShopifyProducts } = await import("./shopify.mjs");
  const { supabase } = await import("./supabase.mjs");

  const products = await fetchShopifyProducts();

  if (!products || products.length === 0) {
    if (log) console.error("❌ No products received from Shopify API.");
    throw new Error("No products received from Shopify API.");
  }

  // Explicit onConflict target, same fix as the verdicts upsert
  // (src/app/api/verdicts/route.ts): without it, PostgREST resolves
  // conflicts against the table's primary key rather than the `id` column
  // specifically, so a schema where those differ silently falls back to a
  // plain insert per row — failing (and dropping that vendor from every
  // comparison it's in) the moment it hits an existing id, with no error
  // surfaced above the batch it happened in.
  for (let i = 0; i < products.length; i += UPSERT_BATCH_SIZE) {
    const batch = products.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      if (log) {
        console.error(
          `❌ Supabase upsert error on batch ${i / UPSERT_BATCH_SIZE + 1}:`,
          error,
        );
      }
      throw error;
    }
  }

  if (log) console.log(`✅ Successfully upserted ${products.length} products.`);

  return products;
}
