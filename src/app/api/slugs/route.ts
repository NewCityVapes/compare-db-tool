import { supabase } from "../../../../lib/supabase.mjs"; // make sure this path is correct
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase.from("verdicts").select("slug");

  if (error) {
    console.error("❌ Failed to fetch slugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch slugs" },
      { status: 500 }
    );
  }

  const slugs = data.map((row) => `/compare/${row.slug}`);
  return NextResponse.json(slugs);
}
