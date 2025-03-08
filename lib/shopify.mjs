import fetch from "node-fetch";

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-10/graphql.json`;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

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
    console.log(`📡 Fetching products... Page cursor: ${endCursor}`);

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
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }`;

    const response = await fetch(SHOPIFY_API_URL, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    console.log("🛍️ Shopify API Response:", JSON.stringify(json, null, 2));

    if (!json.data || !json.data.products) {
      throw new Error("❌ Shopify API Error: No products found.");
    }

    const products = json.data.products.edges.map(({ node }) => ({
      id: node.id.replace("gid://shopify/Product/", ""),
      title: node.title,
      vendor: node.vendor,
      productType: node.productType || "Unknown",
      price: node.variants?.edges[0]?.node?.price || "0.00",
      imageUrl: node.featuredImage?.url || null,
      ml: node.capacity_ml?.value || null,
      battery: node.battery_mah?.value || null,
      puffCount: node.puff_count?.value ? parseInt(node.puff_count.value, 10) : null
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
