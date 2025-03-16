import { supabase } from "../../../../lib/supabase.mjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allVendors = [];

    let hasNextPage = true;
    let offset = 0;

    // ✅ Paginate to fetch all vendors for product type "DISPOSABLES"
    while (hasNextPage) {
      const { data, error } = await supabase
        .from("products")
        .select("vendor")
        .eq("productType", "DISPOSABLES") // ✅ Filter by product type "DISPOSABLES"
        .neq("vendor", null)
        .neq("vendor", "")
        .order("vendor", { ascending: true })
        .range(offset, offset + 999); // ✅ Fetch in 1000-row chunks

      if (error) throw error;

      allVendors.push(...data);
      offset += 1000;

      if (data.length < 1000) {
        hasNextPage = false;
      }
    }

    console.log("🔥 Final Vendor Count (DISPOSABLES only):", allVendors.length);
    const uniqueVendors = [
      ...new Set(allVendors.map((item) => item.vendor?.trim())),
    ];

    return NextResponse.json(uniqueVendors);
  } catch (error) {
    console.error("❌ API Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
