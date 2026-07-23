import { NextResponse } from "next/server";
import { syncShopifyProducts } from "../../../../../lib/syncShopify";
import { revalidateAllComparisons } from "../../../../../lib/revalidate";

// See src/app/api/sync-shopify/route.ts for why this is needed.
export const maxDuration = 60;

// Vercel Cron requests aren't a logged-in browser, so this can't use the
// admin session cookie — it checks a shared secret instead. Vercel sends
// `Authorization: Bearer $CRON_SECRET` automatically for scheduled
// invocations defined in vercel.json, as long as CRON_SECRET is set as an
// environment variable.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncShopifyProducts();
    revalidateAllComparisons();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cron sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
