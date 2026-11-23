import { supabase } from "../../../../../lib/supabase.mjs";
import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../../lib/auth";
import { canonicalizeSlug } from "../../../../../lib/slug";
import { revalidateComparison } from "../../../../../lib/revalidate";
import { verdictSlugCandidates } from "../../../../../lib/comparisons";

/**
 * Saves the French version of an existing verdict. Only ever touches the
 * content_fr / updated_at_fr columns, so it can't disturb the English text.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendor1, vendor2, contentFr } = await req.json().catch(() => ({}));

  if (!vendor1 || !vendor2 || typeof contentFr !== "string" || !contentFr.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const slug = canonicalizeSlug(vendor1, vendor2);
  const candidates = verdictSlugCandidates(vendor1, vendor2, slug);

  const { data: rows, error: readError } = await supabase
    .from("verdicts")
    .select("slug, content")
    .in("slug", candidates);

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!rows?.some((r) => r.content?.trim())) {
    return NextResponse.json(
      { error: "Save an English verdict for this pair first." },
      { status: 400 },
    );
  }

  // Duplicate legacy rows can exist for one pair (see verdictSlugCandidates);
  // write to all of them so whichever one the live page reads has the French.
  const { error } = await supabase
    .from("verdicts")
    .update({ content_fr: contentFr, updated_at_fr: new Date().toISOString() })
    .in(
      "slug",
      rows.map((r) => r.slug),
    );

  if (error) {
    console.error("Supabase French save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateComparison(slug);
  return NextResponse.json({ success: true });
}
