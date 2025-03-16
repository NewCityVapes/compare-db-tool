import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Fetching Shopify Header...");

    const shopifyURL = "https://newcityvapes.com"; // ✅ Your store URL

    const response = await fetch(shopifyURL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const html = await response.text();

    // Extract the header using regex
    const headerMatch = html.match(/<header[\s\S]*?<\/header>/);
    const header = headerMatch ? headerMatch[0] : "<header>Not Found</header>";

    console.log("✅ Shopify Header Fetched Successfully");
    return NextResponse.json({ html: header });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching Shopify data:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}
