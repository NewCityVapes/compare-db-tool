import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/auth";
import { syncShopifyProducts } from "../../../../lib/syncShopify";
import { revalidateAllComparisons } from "../../../../lib/revalidate";

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
