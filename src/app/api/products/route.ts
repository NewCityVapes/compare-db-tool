import { supabase } from "../../../../lib/supabase.mjs";
import { NextResponse, NextRequest } from "next/server";

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

    const formattedVendor = vendor.trim().toLowerCase().replace(/-/g, " ");
    console.log(`🔍 Fetching products for vendor: "${formattedVendor}"`);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("vendor", formattedVendor)
      .limit(1000)
      .order("title", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API Error fetching products:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
