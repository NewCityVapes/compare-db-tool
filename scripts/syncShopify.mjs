import { supabase } from "../lib/supabase.mjs";
import { fetchShopifyProducts } from "../lib/shopify.mjs";
import fs from "fs";
import path from "path";

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

  const { data, error } = await supabase.from("products").upsert(products);

  if (error) {
    console.error("❌ Supabase Insert Error:", JSON.stringify(error, null, 2));
    fs.appendFileSync(logFile, `❌ Supabase Insert Error: ${JSON.stringify(error, null, 2)}\n`);
  } else {
    console.log(`✅ Successfully Inserted ${products.length} products.`);
    fs.appendFileSync(logFile, `✅ Successfully Inserted ${products.length} products.\n`);
  }

  console.log(`🎉 Sync Complete!`);
  fs.appendFileSync(logFile, "🎉 Sync Complete!\n");
}

// ✅ Call the function
syncProducts().catch(console.error);
