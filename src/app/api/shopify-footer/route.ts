import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Fetching Shopify Footer...");

    const shopifyURL = "https://newcityvapes.com"; // ✅ Your Shopify store URL

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

    // Extract the footer using regex
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
    const footer = footerMatch ? footerMatch[0] : "<footer>Not Found</footer>";

    console.log("✅ Shopify Footer Fetched Successfully");
    return NextResponse.json({ html: footer });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching Shopify data:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}
