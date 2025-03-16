"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image"; // ✅ Use Next.js Image

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();

  // ✅ Extract vendors from URL
  const slug = params?.slug as string;
  const [rawVendor1, rawVendor2] = slug?.split("-vs-") || [];
  const selectedVendor1 = decodeURIComponent(rawVendor1);
  const selectedVendor2 = decodeURIComponent(rawVendor2);

  const [vendors, setVendors] = useState<string[]>([]);
  const [products1, setProducts1] = useState<Product[]>([]);
  const [products2, setProducts2] = useState<Product[]>([]);

  type Product = {
    id: string;
    title: string;
    price: number;
    puffCount?: number;
    ml?: number;
    battery?: number;
    imageUrl?: string;
    link?: string;
  };

  // ✅ Fetch vendors
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

  const fetchProducts = useCallback(
    async (vendor: string, setProducts: (data: Product[]) => void) => {
      try {
        const formattedVendor = encodeURIComponent(vendor.replace(/-/g, " "));
        const res = await fetch(`/api/products?vendor=${formattedVendor}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(`❌ Error fetching products for ${vendor}:`, error);
      }
    },
    []
  );

  // ✅ Fetch products when URL changes
  useEffect(() => {
    if (selectedVendor1 && selectedVendor2) {
      fetchProducts(selectedVendor1, setProducts1);
      fetchProducts(selectedVendor2, setProducts2);
    }
  }, [selectedVendor1, selectedVendor2, fetchProducts]);

  function updateVendorSelection(vendor1: string, vendor2: string) {
    const newSlug = `${encodeURIComponent(
      vendor1.trim()
    )}-vs-${encodeURIComponent(vendor2.trim())}`;
    router.push(`/compare/${newSlug}`);
  }

  return (
    <div className="comparison-container">
      <h1 className="page-title">Disposable Comparison Tool</h1>
      <h2 className="page-subtitle">Which Vape is Better?</h2>

      {/* ✅ Dropdowns + Product Display */}
      <div className="dropdown-container">
        {[
          { vendor: selectedVendor1, products: products1 },
          { vendor: selectedVendor2, products: products2 },
        ].map((item, index) => (
          <div key={index} className="product-column">
            <select
              className="dropdown"
              value={item.vendor}
              onChange={(e) =>
                updateVendorSelection(
                  index === 0 ? e.target.value : selectedVendor1,
                  index === 1 ? e.target.value : selectedVendor2
                )
              }
            >
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>

            {/* ✅ Product Image Placeholder */}
            <div className="product-image-container">
              {item.products.length > 0 ? (
                <Image
                  src={item.products[0].imageUrl || ""}
                  alt={item.products[0].title}
                  width={350}
                  height={350}
                  className="product-image"
                />
              ) : (
                <div className="image-placeholder">Loading...</div>
              )}
            </div>

            {/* ✅ Price & Buy Link */}
            {item.products.length > 0 && (
              <a
                href={item.products[0].link || "#"}
                target="_blank"
                className="buy-link"
              >
                BUY • ${item.products[0].price.toFixed(2)}
              </a>
            )}
          </div>
        ))}

        {/* ✅ Properly Centered VS */}
        <div className="vs-container">
          <span className="vs-text">VS</span>
        </div>
      </div>

      {/* ✅ Comparison Table */}
      <h2 className="comparison-header">
        {selectedVendor1} vs {selectedVendor2}
      </h2>

      <div className="comparison-table">
        {[
          { label: "PUFF COUNT", key: "puffCount" },
          { label: "ML", key: "ml" },
          { label: "BATTERY", key: "battery" },
          { label: "PRICE", key: "price" },
        ].map(({ label, key }) => (
          <div key={key} className="attribute-row">
            <div className="attribute-header">{label}</div>
            <div className="attribute-values flex flex-col md:flex-row">
              <span className="text-center md:text-left">
                {products1.length > 0
                  ? products1[0][key as keyof Product] || "N/A"
                  : "N/A"}
              </span>
              <span className="text-center md:text-right">
                {products2.length > 0
                  ? products2[0][key as keyof Product] || "N/A"
                  : "N/A"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
