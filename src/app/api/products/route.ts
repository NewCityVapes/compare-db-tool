import { supabase } from "../../../../lib/supabase.mjs";
import { NextResponse, NextRequest } from "next/server";
import { productsForVendorSlug } from "../../../../lib/comparisons";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const vendor = url.searchParams.get("vendor");

    if (!vendor) {
      return NextResponse.json(
        { error: "Missing vendor parameter" },
        { status: 400 }
      );
    }

    // Matched by re-slugifying each row's real `vendor` value rather than
    // reconstructing a search string from the slug — the latter is lossy for
    // vendor names with punctuation (e.g. "Drip'n EVO Series 28K"), since a
    // stripped apostrophe can never be reconstructed from the slug alone.
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .not("vendor", "is", null)
      .order("title", { ascending: true });

    if (error) throw error;

    const matches = productsForVendorSlug(data ?? [], vendor);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("❌ API Error fetching products:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
