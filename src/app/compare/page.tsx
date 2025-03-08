"use client";

import { useState, useEffect } from "react";

import ShopifyHeader from "../../../components/ShopifyFooter";
import ShopifyFooter from "../../../components/ShopifyHeader";

export default function ComparePage() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor1, setSelectedVendor1] = useState<string | null>(null);
  const [selectedVendor2, setSelectedVendor2] = useState<string | null>(null);
  const [products1, setProducts1] = useState<any[]>([]);
  const [products2, setProducts2] = useState<any[]>([]);

  useEffect(() => {
    async function fetchVendors() {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data);
    }
    fetchVendors();
  }, []);

  async function fetchProducts(
    vendor: string,
    setProducts: (data: any[]) => void
  ) {
    const res = await fetch(`/api/products?vendor=${vendor}`);
    const data = await res.json();
    setProducts(data);
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
            value={selectedVendor1 || ""}
            onChange={(e) => {
              setSelectedVendor1(e.target.value);
              fetchProducts(e.target.value, setProducts1);
            }}
          >
            <option value="">-- Select --</option>
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
            value={selectedVendor2 || ""}
            onChange={(e) => {
              setSelectedVendor2(e.target.value);
              fetchProducts(e.target.value, setProducts2);
            }}
          >
            <option value="">-- Select --</option>
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
          <div>
            {selectedVendor1 && (
              <h3 className="text-xl font-medium mb-2">{selectedVendor1}</h3>
            )}
            {products1.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Price</th>
                    <th className="border p-2">Puffs</th>
                  </tr>
                </thead>
                <tbody>
                  {products1.map((product) => (
                    <tr key={product.id}>
                      <td className="border p-2">{product.title}</td>
                      <td className="border p-2">${product.price}</td>
                      <td className="border p-2">
                        {product.puffCount || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Vendor 2 Products */}
          <div>
            {selectedVendor2 && (
              <h3 className="text-xl font-medium mb-2">{selectedVendor2}</h3>
            )}
            {products2.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Price</th>
                    <th className="border p-2">Puffs</th>
                  </tr>
                </thead>
                <tbody>
                  {products2.map((product) => (
                    <tr key={product.id}>
                      <td className="border p-2">{product.title}</td>
                      <td className="border p-2">${product.price}</td>
                      <td className="border p-2">
                        {product.puffCount || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
