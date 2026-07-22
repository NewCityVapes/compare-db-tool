import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase.mjs";
import { isAdminRequest } from "../../../../../lib/auth";
import { canonicalizeSlug } from "../../../../../lib/slug";
import { revalidateComparison } from "../../../../../lib/revalidate";

interface BulkItem {
  vendor1?: string;
  vendor2?: string;
  content?: string;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const items = body?.items;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Expected a non-empty JSON array under 'items'" },
      { status: 400 },
    );
  }

  const rows: { slug: string; vendor1: string; vendor2: string; content: string }[] = [];

  for (const [index, item] of (items as BulkItem[]).entries()) {
    const { vendor1, vendor2, content } = item ?? {};
    if (!vendor1 || !vendor2 || !content) {
      return NextResponse.json(
        {
          error: `Item ${index} is missing vendor1, vendor2, or content — nothing was saved`,
        },
        { status: 400 },
      );
    }
    rows.push({ slug: canonicalizeSlug(vendor1, vendor2), vendor1, vendor2, content });
  }

  const { error } = await supabase
    .from("verdicts")
    .upsert(rows, { onConflict: "slug" });

  if (error) {
    console.error("Bulk verdict upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const row of rows) {
    revalidateComparison(row.slug);
  }

  return NextResponse.json({ success: true, count: rows.length });
}
