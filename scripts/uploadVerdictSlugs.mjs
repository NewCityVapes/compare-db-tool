// scripts/uploadVerdictSlugs.mjs
// Generates verdict slugs for ALL disposable product combinations

import dotenv from "dotenv";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getDisposableVendors() {
  console.log('📦 Fetching ALL disposable vendors from Supabase...');
  
  let allProducts = [];
  let from = 0;
  const limit = 1000; // Fetch 1000 at a time
  let hasMore = true;

  // Pagination loop to get ALL products
  while (hasMore) {
    const { data, error } = await supabase
      .from("products")
      .select("vendor")
      .eq("productType", "DISPOSABLES")
      .range(from, from + limit - 1);

    if (error) {
      console.error("❌ Error fetching vendors:", error.message);
      process.exit(1);
    }

    if (data.length === 0) {
      hasMore = false;
    } else {
      allProducts.push(...data);
      console.log(`   Fetched ${allProducts.length} products so far...`);
      from += limit;
    }
  }

  // Get unique vendor names
  const uniqueVendors = Array.from(new Set(allProducts.map((p) => p.vendor))).filter(Boolean);
  
  console.log(`\n✅ Found ${uniqueVendors.length} unique vendors`);
  console.log(`📊 Total products: ${allProducts.length}\n`);
  
  // Show all vendors for reference
  console.log('📋 All vendors:');
  uniqueVendors.sort().forEach(v => console.log(`   - ${v}`));
  console.log('');
  
  return uniqueVendors;
}

function toSlug(str) {
  return slugify(str, { lower: true, strict: true });
}

function getAllCombinations(vendors) {
  console.log('🔄 Generating all vendor combinations...\n');
  const combinations = [];

  // Generate all A vs B combinations (excluding A vs A)
  for (let i = 0; i < vendors.length; i++) {
    for (let j = 0; j < vendors.length; j++) {
      if (i === j) continue; // skip same vendor

      const vendor1 = vendors[i];
      const vendor2 = vendors[j];
      const slug = `${toSlug(vendor1)}-vs-${toSlug(vendor2)}`;
      combinations.push({ vendor1, vendor2, slug });
    }
  }

  return combinations;
}

async function uploadVerdictSlugs() {
  console.log('🚀 Starting verdict slug generation...\n');
  
  const vendors = await getDisposableVendors();
  const combos = getAllCombinations(vendors);

  console.log(`📝 Generated ${combos.length} total combinations\n`);

  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  console.log('💾 Uploading to database...\n');

  for (const combo of combos) {
    const { vendor1, vendor2, slug } = combo;

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("verdicts")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      skippedCount++;
      continue; // Don't log skips to avoid spam
    }

    // Insert new verdict
    const { error } = await supabase.from("verdicts").insert([
      {
        slug,
        vendor1,
        vendor2,
        content: "", // Empty content - will be filled later
      },
    ]);

    if (error) {
      console.error(`❌ Error inserting ${slug}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Inserted: ${slug}`);
      insertedCount++;
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Verdict Slug Upload Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully inserted: ${insertedCount} new verdicts`);
  console.log(`⏭️  Skipped (already exist): ${skippedCount} verdicts`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total combinations: ${combos.length}`);
  console.log(`🏷️  Unique vendors: ${vendors.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (insertedCount > 0) {
    console.log('💡 Next steps:');
    console.log('   1. Run: node scripts/exportslugs.mjs');
    console.log('   2. Update public-slugs.txt with new slugs');
    console.log('   3. Add content to verdicts using updateReviews script\n');
  }
}

uploadVerdictSlugs();
