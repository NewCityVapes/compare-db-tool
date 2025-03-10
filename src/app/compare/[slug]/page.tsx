"use client";
import { useCallback } from "react";
import ComparisonTable from "../../components/ComparisonTable";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useParams } from "next/navigation";

export default function ComparePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams(); // ✅ Unwrap params properly

  // ✅ Extract vendor names from URL safely
  const slug = params?.slug as string;
  const [rawVendor1, rawVendor2] = slug?.split("-vs-") || [
    "1hundred",
    "1hundred",
  ];

  const vendor1 = decodeURIComponent(rawVendor1);
  const vendor2 = decodeURIComponent(rawVendor2);

  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor1, setSelectedVendor1] = useState<string>(vendor1);
  const [selectedVendor2, setSelectedVendor2] = useState<string>(vendor2);

  type Product = {
    id: string;
    title: string;
    price: string;
    puffCount?: number;
  };

  const [products1, setProducts1] = useState<Product[]>([]);
  const [products2, setProducts2] = useState<Product[]>([]);

  // ✅ Fetch vendors from API
  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch("/api/vendors");
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setVendors(data);
      } catch (error) {
        console.error("❌ Error fetching vendors:", error);
      }
    }
    fetchVendors();
  }, []);

  // ✅ Fetch products based on selected vendor

  const fetchProducts = useCallback(
    async (vendor: string, setProducts: (data: Product[]) => void) => {
      try {
        const formattedVendor = encodeURIComponent(vendor.replace(/-/g, " "));

        console.log(
          `🔍 Fetching products for vendor: "${vendor}" -> API request: /api/products?vendor=${formattedVendor}`
        );

        const res = await fetch(`/api/products?vendor=${formattedVendor}`);

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        console.log(`🔥 Products for ${vendor}:`, data);
        setProducts(data);
      } catch (error) {
        console.error(`❌ Error fetching products for ${vendor}:`, error);
      }
    },
    []
  ); // ✅ Empty dependency array ensures function is memoized

  // ✅ Load products when vendors change
  useEffect(() => {
    if (selectedVendor1 && selectedVendor2) {
      console.log(
        `🔄 Fetching products for ${selectedVendor1} & ${selectedVendor2}`
      );
      fetchProducts(selectedVendor1, setProducts1);
      fetchProducts(selectedVendor2, setProducts2);
    }
  }, [selectedVendor1, selectedVendor2, fetchProducts]); // ✅ Include fetchProducts

  // ✅ Update URL when user selects a new vendor
  function updateURL(vendor1: string, vendor2: string) {
    const formattedVendor1 = encodeURIComponent(vendor1.trim());
    const formattedVendor2 = encodeURIComponent(vendor2.trim());

    const newSlug = `${formattedVendor1}-vs-${formattedVendor2}`;

    if (pathname !== `/compare/${newSlug}`) {
      router.push(`/compare/${newSlug}`);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Compare Disposable Products</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Vendor 1 Dropdown */}
        <div>
          <label className="block mb-2 text-lg">Select Vendor 1:</label>
          <select
            className="border p-2 w-full"
            value={selectedVendor1}
            onChange={(e) => {
              setSelectedVendor1(e.target.value);
              updateURL(e.target.value, selectedVendor2);
            }}
          >
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor 2 Dropdown */}
        <div>
          <label className="block mb-2 text-lg">Select Vendor 2:</label>
          <select
            className="border p-2 w-full"
            value={selectedVendor2}
            onChange={(e) => {
              setSelectedVendor2(e.target.value);
              updateURL(selectedVendor1, e.target.value);
            }}
          >
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mt-6">
        <h2 className="text-2xl font-semibold">Product Comparison</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Vendor 1 Products */}
          <ComparisonTable
            selectedVendor={selectedVendor1}
            products={products1}
          />

          {/* Vendor 2 Products */}
          <ComparisonTable
            selectedVendor={selectedVendor2}
            products={products2}
          />
        </div>
      </div>
    </div>
  );
}
