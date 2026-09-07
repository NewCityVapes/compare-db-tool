// scripts/fixImageAltText.mjs
// ============================================================
// Ahrefs Site Audit flags 246 images with missing alt text on
// newcityvapes.com. Same shape as fixSeoDescriptions.mjs: walk the active
// catalog, find product images with no alt text, and set one built from
// real data already on the product (title + vendor) — not generic filler
// like "product image".
//
// Uses the `fileUpdate` mutation, which accepts a batch — so this sends
// one mutation per BATCH_SIZE images rather than one per image.
//
// Usage:
//   node scripts/fixImageAltText.mjs --dry-run
//   node scripts/fixImageAltText.mjs --limit 50
//   node scripts/fixImageAltText.mjs
//
// NOT covered by this script: the 459 images Ahrefs flags as
// file-size-too-large. That's a different fix — either re-uploading
// compressed originals (real image processing, not a metadata edit) or
// making sure theme templates request sized/compressed CDN variants
// instead of full-resolution originals, which lives in the Shopify theme
// (Liquid templates), not this repo. Flagging it rather than
// half-fixing it.
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
const BATCH_SIZE = 25; // fileUpdate accepts a list — batch the mutation itself, not just the scan.

const logDir = "./logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, "fix-image-alt-text.log");
function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/** Real alt text from the product's own title/vendor — describes the actual image, invents nothing. */
function buildAlt(product) {
  return `${product.title} — ${product.vendor} disposable vape, New City Vapes`;
}

async function* fetchImagesMissingAlt() {
  let cursor = null;
  let hasNextPage = true;
  const query = `
    query($cursor: String) {
      products(first: 50, after: $cursor, query: "status:active") {
        edges {
          node {
            id
            title
            vendor
            media(first: 10) {
              edges {
                node {
                  __typename
                  ... on MediaImage { id alt }
                }
              }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`;

  while (hasNextPage) {
    const data = await shopifyGraphQL(query, { cursor });
    for (const edge of data.products.edges) {
      const product = edge.node;
      for (const mediaEdge of product.media.edges) {
        const media = mediaEdge.node;
        if (media.__typename === "MediaImage" && !media.alt?.trim()) {
          yield { mediaId: media.id, product };
        }
      }
    }
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
    await sleep(300);
  }
}

async function updateAltBatch(items) {
  const mutation = `
    mutation($files: [FileUpdateInput!]!) {
      fileUpdate(files: $files) {
        userErrors { field message }
      }
    }`;
  const files = items.map((item) => ({ id: item.mediaId, alt: buildAlt(item.product) }));
  const data = await shopifyGraphQL(mutation, { files });
  if (data.fileUpdate.userErrors.length > 0) {
    throw new Error(JSON.stringify(data.fileUpdate.userErrors));
  }
}

async function run() {
  if (!SHOPIFY_ADMIN_API_ACCESS_TOKEN || !process.env.SHOPIFY_STORE_URL) {
    log("❌ SHOPIFY_STORE_URL / SHOPIFY_ADMIN_API_ACCESS_TOKEN not set — check .env.local");
    process.exit(1);
  }

  log(`\n🕒 Starting image alt-text fix at ${new Date().toISOString()} ${DRY_RUN ? "(DRY RUN)" : ""}`);

  let scanned = 0;
  let fixed = 0;
  let batch = [];

  async function flush() {
    if (batch.length === 0) return;
    for (const item of batch) {
      log(`${DRY_RUN ? "🔍 Would set" : "✏️  Setting"} alt on [${item.product.title}]: "${buildAlt(item.product)}"`);
    }
    if (!DRY_RUN) {
      try {
        await updateAltBatch(batch);
        await sleep(300);
      } catch (err) {
        log(`❌ Failed on batch starting with ${batch[0].product.title}: ${err.message}`);
      }
    }
    fixed += batch.length;
    batch = [];
  }

  for await (const item of fetchImagesMissingAlt()) {
    if (fixed + batch.length >= LIMIT) break;
    scanned++;
    batch.push(item);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  log(`\n🎉 Done. Scanned ${scanned} images missing alt text, ${DRY_RUN ? "would fix" : "fixed"} ${fixed}.`);
}

run().catch((err) => {
  log(`❌ Fatal error: ${err.stack || err.message}`);
  process.exit(1);
});
