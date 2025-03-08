import { NextResponse } from "next/server";

const SHOPIFY_STORE_URL = "https://2cd994.myshopify.com";

export async function GET() {
  try {
    // Fetch Shopify Homepage
    const response = await fetch(SHOPIFY_STORE_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();

    // Extract header/footer using Regex
    const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);

    // Extract styles/scripts
    const stylesMatch = html.match(/<link[^>]*stylesheet[^>]*>/g) || [];
    const scriptsMatch =
      html.match(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/g) || [];

    return NextResponse.json({
      header: headerMatch ? headerMatch[0] : "",
      footer: footerMatch ? footerMatch[0] : "",
      styles: stylesMatch.join("\n"),
      scripts: scriptsMatch.join("\n"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Shopify layout" },
      { status: 500 }
    );
  }
}
