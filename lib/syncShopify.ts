// lib/syncShopify.ts
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

  const { data, error } = await supabase.from("products").upsert(products);

  if (error) {
    if (log) console.error("❌ Supabase Insert Error:", error);
    throw error;
  }

  if (log) console.log(`✅ Successfully inserted ${products.length} products.`);

  return data;
}
