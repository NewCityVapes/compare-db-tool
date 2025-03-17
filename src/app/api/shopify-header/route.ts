import { NextResponse } from "next/server";

export async function GET() {
  try {
    const shopifyURL = "https://www.newcityvapes.com"; // ✅ Replace with your Shopify store URL
    const res = await fetch(shopifyURL);

    if (!res.ok) throw new Error("Failed to fetch Shopify header");

    const html = await res.text();

    // Extract only the header section
    const headerMatch = html.match(/<header.*?<\/header>/s);
    const headerHtml = headerMatch ? headerMatch[0] : "";

    return new NextResponse(headerHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch Shopify header" });
  }
}
