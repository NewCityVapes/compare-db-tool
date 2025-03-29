import { supabase } from "../../../../lib/supabase.mjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { vendor1, vendor2, content } = await req.json(); // ✅ must match DB column

  if (!vendor1 || !vendor2 || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const slug = `${vendor1.toLowerCase().replace(/\s+/g, "-")}-vs-${vendor2
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  const { error } = await supabase.from("verdicts").upsert([
    {
      slug,
      vendor1,
      vendor2,
      content, // ✅ this must match the actual column name
    },
  ]);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
