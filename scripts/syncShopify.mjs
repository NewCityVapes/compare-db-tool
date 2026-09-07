import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";

// ✅ Dynamically import Supabase + Shopify *after* env is loaded
const { supabase } = await import("../lib/supabase.mjs");
const { fetchShopifyProducts } = await import("../lib/shopify.mjs");




async function syncProducts() {
  const timestamp = new Date().toISOString();
  console.log(`\n🕒 Running Shopify Sync at ${timestamp}`);

  const logDir = "./logs";
  const logFile = path.join(logDir, "sync.log");

  // ✅ Ensure `logs/` directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(logFile, `\n🕒 Running Shopify Sync at ${timestamp}\n`);

  console.log("⏳ Fetching Shopify Products...");
  const products = await fetchShopifyProducts();



  if (!products || products.length === 0) {
    console.error("❌ No products received from Shopify API.");
    fs.appendFileSync(logFile, "❌ No products received from Shopify API.\n");
    return;
  }

  console.log(`🛍️ Preparing to insert ${products.length} products into Supabase...`);
  fs.appendFileSync(logFile, `🛍️ Inserting ${products.length} products...\n`);

  // Batched + explicit onConflict for the same reason as lib/syncShopify.ts:
  // one unbatched upsert on a catalog this size risks payload/param-limit
  // failures, and without onConflict a mismatched primary key silently
  // falls back to per-row inserts that fail on any existing id.
  const BATCH_SIZE = 250;
  let insertError = null;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("products").upsert(batch, { onConflict: "id" });
    if (error) {
      insertError = error;
      break;
    }
  }

  if (insertError) {
    console.error("❌ Supabase Insert Error:", JSON.stringify(insertError, null, 2));
    fs.appendFileSync(logFile, `❌ Supabase Insert Error: ${JSON.stringify(insertError, null, 2)}\n`);
  } else {
    console.log(`✅ Successfully Inserted ${products.length} products.`);
    fs.appendFileSync(logFile, `✅ Successfully Inserted ${products.length} products.\n`);
  }

  console.log(`🎉 Sync Complete!`);
  fs.appendFileSync(logFile, "🎉 Sync Complete!\n");
}

// ✅ Call the function
syncProducts().catch(console.error);
