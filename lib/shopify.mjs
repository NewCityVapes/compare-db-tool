import fetch from "node-fetch";

// 2023-10 was ~3 years past its supported window (Shopify supports roughly
// the last 4 quarterly releases). Bumped to a currently-supported version —
// if Shopify starts rejecting this again in the future, check
// https://shopify.dev/docs/api/usage/versioning for the current list and
// update this string.
const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2025-10/graphql.json`;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchShopifyProducts() {
  console.log("🚀 Fetching All Shopify Products...");

  let allProducts = [];
  let hasNextPage = true;
  let endCursor = null;
  let requestCount = 0; // ✅ Track API calls

  while (hasNextPage) {
    const query = `
    {
      products(first: 250, after: ${endCursor ? `"${endCursor}"` : "null"}) {
        edges {
          node {
            id
            title
            vendor
            productType
            featuredImage { url }
            variants(first: 1) {
              edges { node { price } }
            }
    
            capacity_ml: metafield(namespace: "custom", key: "capacity_ml_") { value }
            battery_mah: metafield(namespace: "custom", key: "battery_mah_") { value }
            puff_count: metafield(namespace: "custom", key: "puff_count") { value }
    collection_handle: metafield(namespace: "custom", key: "collection_handle") { value }
            price_per_puff: metafield(namespace: "custom", key: "price_per_puff") { value }
            price_per_ml: metafield(namespace: "custom", key: "price_per_ml") { value }
            number_of_flavours: metafield(namespace: "custom", key: "number_of_flavours") { value }
            features: metafield(namespace: "custom", key: "features") { value }
            expert_review: metafield(namespace: "custom", key: "expert_review") { value }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
    `;
    const response = await fetch(SHOPIFY_API_URL, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();

    if (!json.data || !json.data.products) {
      // Surface the real reason on failure only (not on every successful
      // page) — the generic "No products found" message alone previously
      // gave no way to tell a bad token/scope apart from a stale API
      // version apart from an actual empty catalog.
      console.error(
        "Shopify API did not return products. status:",
        response.status,
        "errors:",
        JSON.stringify(json.errors ?? json),
      );
      throw new Error("❌ Shopify API Error: No products found.");
    }

    const products = json.data.products.edges.map(({ node }) => ({
      id: node.id.replace("gid://shopify/Product/", ""),
      title: node.title,
      vendor: node.vendor,
      productType: node.productType || "Unknown",
      price: parseFloat(node.variants?.edges[0]?.node?.price || "0.00"),
      imageUrl: node.featuredImage?.url || null,
      ml: node.capacity_ml?.value ? parseInt(node.capacity_ml.value, 10) : null,
      battery: node.battery_mah?.value
        ? parseInt(node.battery_mah.value, 10)
        : null,
      puffCount: node.puff_count?.value
        ? parseInt(node.puff_count.value, 10)
        : null,

      // ✅ New metafields
      pricePerPuff: node.price_per_puff?.value
        ? parseFloat(node.price_per_puff.value)
        : null,
      pricePerML: node.price_per_ml?.value
        ? parseFloat(node.price_per_ml.value)
        : null,
      numberOfFlavours: node.number_of_flavours?.value
        ? parseInt(node.number_of_flavours.value, 10)
        : null,
      features: node.features?.value || null,
      expertReview: node.expert_review?.value || null,
      collectionHandle: node.collection_handle?.value || null, // ✅ Use metafield
    }));

    allProducts = [...allProducts, ...products];

    hasNextPage = json.data.products.pageInfo.hasNextPage;
    endCursor = json.data.products.pageInfo.endCursor;

    requestCount++;

    // ✅ Shopify API Throttling: If requestCount reaches 2, wait 1 second
    if (requestCount % 2 === 0) {
      console.log("⏳ Waiting to prevent Shopify API Throttling...");
      await sleep(1000); // Wait 1 second before next request
    }
  }

  console.log(`✅ Total Products Fetched: ${allProducts.length}`);
  return allProducts;
}

export { fetchShopifyProducts };
