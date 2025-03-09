import { supabase } from "../../../../lib/supabase.mjs";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url); // ✅ Ensure we correctly parse the URL
    const vendor = url.searchParams.get("vendor");

    if (!vendor) {
      return NextResponse.json(
        { error: "Missing vendor parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .select("*") // ✅ Fetch all columns
      .eq("vendor", vendor) // ✅ Filter by vendor
      .limit(1000) // ✅ Ensure all products are fetched
      .order("title", { ascending: true });

    if (error) throw error;

    console.log(`🔥 Products for ${vendor}:`, data); // ✅ Debugging log

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ API Error fetching products:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
