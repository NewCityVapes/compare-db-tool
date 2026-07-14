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

  const { error } = await supabase.from("verdicts").upsert([
    {
      slug,
      vendor1,
      vendor2,
      content,
    },
  ]);

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateComparison(slug);

  return NextResponse.json({ success: true });
}
