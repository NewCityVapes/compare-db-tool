// scripts/uploadVerdictSlugs.mjs

import dotenv from "dotenv";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

// Load env vars from .env.local
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getDisposableVendors() {
  const { data, error } = await supabase
    .from("products")
    .select("vendor")
    .eq("product_type", "DISPOSABLES");

  if (error) {
    console.error("❌ Error fetching vendors:", error.message);
    process.exit(1);
  }

  const uniqueVendors = Array.from(new Set(data.map((p) => p.vendor)));
  return uniqueVendors;
}

function toSlug(str) {
  return slugify(str, { lower: true, strict: true });
}

function getAllCombinations(vendors) {
    const combinations = [];
  
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
  const vendors = await getDisposableVendors();
  const combos = getAllCombinations(vendors);

  for (const combo of combos) {
    const { vendor1, vendor2, slug } = combo;

    const { data: existing } = await supabase
      .from("verdicts")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      console.log(`✅ Already exists: ${slug}`);
      continue;
    }

    const { error } = await supabase.from("verdicts").insert([
      {
        slug,
        vendor1,
        vendor2,
        content: "",
      },
    ]);

    if (error) {
      console.error(`❌ Error inserting ${slug}:`, error.message);
    } else {
      console.log(`✅ Inserted: ${slug}`);
    }
  }

  console.log("🎉 Done uploading verdict slugs for DISPOSABLES!");
}

uploadVerdictSlugs();
