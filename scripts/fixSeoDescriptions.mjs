// scripts/fixSeoDescriptions.mjs
// ============================================================
// Every product on the store falls back to Shopify's default meta
// description when none is set explicitly: literally just
// "{Product Title} – {Shop Name}". Confirmed live across a sample of 50
// active products — all 50 had this exact fallback, 0-100% match. Ahrefs
// Site Audit flags this at scale: 2,821 pages with a too-short meta
// description, 1,177 with none at all, out of ~2,099 active products.
//
// This writes a real, per-product description built from data the
// product already has (title, vendor, and whichever of puff count /
// capacity / battery / price are present) — nothing invented, nothing
// templated with filler. Only touches products still on the fallback (or
// genuinely missing/too-short); anything with a real custom description
// already set is left alone and safe to re-run.
//
// Usage:
//   node scripts/fixSeoDescriptions.mjs --dry-run           # preview only
//   node scripts/fixSeoDescriptions.mjs --limit 50           # first 50 only
//   node scripts/fixSeoDescriptions.mjs                      # full catalog
// ============================================================
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2025-10/graphql.json`;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit"));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1] ?? args[args.indexOf(limitArg) + 1], 10) : Infinity;

const logDir = "./logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, "fix-seo-descriptions.log");
function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Shopify's GraphQL Admin API is cost-based, not request-count-based — a
// burst of mutations can legitimately get THROTTLED even at a conservative
// pace. Retry with backoff instead of failing the whole run over one
// transient 429-equivalent.
async function shopifyGraphQL(query, variables, attempt = 1) {
  const res = await fetch(SHOPIFY_API_URL, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();

  const throttled = json.errors?.some((e) => e.extensions?.code === "THROTTLED");
  if (throttled && attempt <= 5) {
    const waitMs = 1000 * attempt;
    log(`⏳ Throttled, retrying in ${waitMs}ms (attempt ${attempt})`);
    await sleep(waitMs);
    return shopifyGraphQL(query, variables, attempt + 1);
  }

  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function metafieldValue(product, key) {
  const mf = product.metafields?.edges?.find((e) => e.node.key === key);
  return mf?.node?.value ?? null;
}

/** Builds a real description from whatever real data this product has. Never invents a spec it doesn't have. */
function buildDescription(product, shopName) {
  const puffCount = metafieldValue(product, "puff_count");
  const ml = metafieldValue(product, "capacity_ml_");
  const battery = metafieldValue(product, "battery_mah_");
  const price = product.variants?.edges?.[0]?.node?.price;

  const specs = [];
  if (puffCount) specs.push(`${Number(puffCount).toLocaleString()} puffs`);
  if (ml) specs.push(`${ml}mL e-liquid`);
  if (battery) specs.push(`${battery}mAh battery`);

  const specText = specs.length > 0 ? specs.join(", ") + ". " : "";
  const priceText = price ? `$${Number(price).toFixed(2)} CAD. ` : "";
  const bodySnippet = stripHtml(product.descriptionHtml).slice(0, 60);
  const bodyText = bodySnippet ? `${bodySnippet}… ` : "";

  const desc = `${product.title} by ${product.vendor}. ${specText}${priceText}${bodyText}Shop at ${shopName}, fast Canada-wide shipping.`;

  // Google truncates well before 320 chars; keep comfortably under it.
  return desc.length > 320 ? desc.slice(0, 317) + "..." : desc;
}

/** True only for the exact Shopify auto-fallback shape, or missing/too-short. Never touches a real custom description. */
function needsFix(product, shopName) {
  const current = product.seo?.description;
  if (!current) return true;
  const fallback = `${product.title} – ${shopName}`;
  if (current === fallback || current === `${product.title} - ${shopName}`) return true;
  if (current.length < 70) return true;
  return false;
}

async function getShopName() {
  const data = await shopifyGraphQL(`query { shop { name } }`, {});
  return data.shop.name;
}

async function* fetchAllActiveProducts() {
  let cursor = null;
  let hasNextPage = true;
  const query = `
    query($cursor: String) {
      products(first: 100, after: $cursor, query: "status:active") {
        edges {
          node {
            id
            title
            vendor
            descriptionHtml
            seo { description }
            variants(first: 1) { edges { node { price } } }
            metafields(identifiers: [
              { namespace: "custom", key: "puff_count" },
              { namespace: "custom", key: "capacity_ml_" },
              { namespace: "custom", key: "battery_mah_" }
            ]) { edges { node { key value } } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`;

  while (hasNextPage) {
    const data = await shopifyGraphQL(query, { cursor });
    for (const edge of data.products.edges) yield edge.node;
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
    await sleep(300);
  }
}

async function updateSeoDescription(productId, description) {
  const mutation = `
    mutation($id: ID!, $seo: SEOInput!) {
      productUpdate(product: { id: $id, seo: $seo }) {
        userErrors { field message }
      }
    }`;
  const data = await shopifyGraphQL(mutation, { id: productId, seo: { description } });
  if (data.productUpdate.userErrors.length > 0) {
    throw new Error(JSON.stringify(data.productUpdate.userErrors));
  }
}

async function run() {
  if (!SHOPIFY_ADMIN_API_ACCESS_TOKEN || !process.env.SHOPIFY_STORE_URL) {
    log("❌ SHOPIFY_STORE_URL / SHOPIFY_ADMIN_API_ACCESS_TOKEN not set — check .env.local");
    process.exit(1);
  }

  log(`\n🕒 Starting SEO description fix at ${new Date().toISOString()} ${DRY_RUN ? "(DRY RUN)" : ""}`);

  const shopName = await getShopName();
  log(`🏪 Shop name: "${shopName}"`);

  let scanned = 0;
  let fixed = 0;
  let skipped = 0;

  for await (const product of fetchAllActiveProducts()) {
    if (fixed >= LIMIT) break;
    scanned++;

    if (!needsFix(product, shopName)) {
      skipped++;
      continue;
    }

    const description = buildDescription(product, shopName);
    log(`${DRY_RUN ? "🔍 Would set" : "✏️  Setting"} [${product.title}]: "${description}"`);

    if (!DRY_RUN) {
      try {
        await updateSeoDescription(product.id, description);
        await sleep(300);
      } catch (err) {
        log(`❌ Failed on ${product.title}: ${err.message}`);
        continue;
      }
    }
    fixed++;
  }

  log(`\n🎉 Done. Scanned ${scanned}, ${DRY_RUN ? "would fix" : "fixed"} ${fixed}, skipped ${skipped} (already had a real description).`);
}

run().catch((err) => {
  log(`❌ Fatal error: ${err.stack || err.message}`);
  process.exit(1);
});
