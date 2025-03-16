import { NextResponse } from "next/server";

export async function GET() {
  try {
    const shopifyStoreUrl = "https://newcityvapes.com"; // Your store URL
    const response = await fetch(`${shopifyStoreUrl}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "❌ Shopify API Error:",
        response.status,
        await response.text()
      );
      return NextResponse.json(
        { error: "Failed to fetch Shopify layout" },
        { status: response.status }
      );
    }

    const html = await response.text();
    return NextResponse.json({ html });
  } catch (error) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
