import { supabase } from "../../../../lib/supabase.mjs";
import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/auth";
import { canonicalizeSlug } from "../../../../lib/slug";
import { revalidateComparison } from "../../../../lib/revalidate";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendor1, vendor2, content } = await req.json();

  if (!vendor1 || !vendor2 || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const slug = canonicalizeSlug(vendor1, vendor2);

  // Without an explicit onConflict target, PostgREST doesn't know which
  // unique constraint to merge on and falls back to a plain insert — which
  // then fails with a 23505 duplicate-key error against the `slug` unique
  // constraint whenever a verdict for this pair already exists. Confirmed by
  // reproducing it directly against a throwaway test row.
  // Set explicitly rather than relying on a DB default — a column DEFAULT
  // only applies on INSERT, not on the UPDATE side of this upsert, so an
  // edit to existing content would leave the timestamp stuck at its
  // original creation time otherwise.
  const { error } = await supabase.from("verdicts").upsert(
    [
      {
        slug,
        vendor1,
        vendor2,
        content,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "slug" },
  );

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateComparison(slug);

  return NextResponse.json({ success: true });
}
