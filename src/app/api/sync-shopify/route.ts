import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/auth";
import { syncShopifyProducts } from "../../../../lib/syncShopify";
import { revalidateAllComparisons } from "../../../../lib/revalidate";

// The default (10s on Hobby, 15s on Pro) isn't enough to page through the
// full Shopify catalog. This only takes effect on Pro+ plans — Hobby has a
// hard, non-configurable 10s ceiling regardless of this value.
export const maxDuration = 60;

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncShopifyProducts();
    revalidateAllComparisons();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
