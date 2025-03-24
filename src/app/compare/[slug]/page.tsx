"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();

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
    pricePerPuff?: number;
    pricePerML?: number;
    numberOfFlavours?: number;
    features?: string;
    expertReview?: string;
  };

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

  function formatValue(
    value: number | string | null | undefined,
    key: string
  ): string {
    if (value === null || value === undefined || value === "") return "N/A";
    const keysToFormatAsCurrency = ["price", "pricePerPuff", "pricePerML"];
    if (keysToFormatAsCurrency.includes(key)) {
      const floatVal = typeof value === "number" ? value : parseFloat(value);
      if (key === "pricePerPuff") {
        return isNaN(floatVal) ? "N/A" : `$${floatVal.toFixed(4)}`;
      } else {
        return isNaN(floatVal) ? "N/A" : `$${floatVal.toFixed(2)}`;
      }
    }
    return value.toString();
  }

  return (
    <div className="comparison-container">
      <h1 className="page-title">Disposable Comparison Review</h1>
      <h2 className="page-subtitle">Which Vape is Better?</h2>

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
        <div className="vs-container">
          <span className="vs-text">VS</span>
        </div>
      </div>

      <h2 className="comparison-header">
        {selectedVendor1} vs {selectedVendor2}
      </h2>

      <div className="comparison-table">
        {[
          { label: "PUFF COUNT", key: "puffCount" },
          { label: "ML", key: "ml" },
          { label: "BATTERY", key: "battery" },
          { label: "PRICE", key: "price" },
          { label: "PRICE PER PUFF", key: "pricePerPuff" },
          { label: "PRICE PER ML", key: "pricePerML" },
          { label: "NUMBER OF FLAVOURS", key: "numberOfFlavours" },
        ].map(({ label, key }, index) => {
          const val1 = products1[0]?.[key as keyof Product] ?? null;
          const val2 = products2[0]?.[key as keyof Product] ?? null;

          return (
            <div key={key} className="attribute-row">
              <div className="attribute-header">{label}</div>
              <div className="attribute-values flex flex-col md:flex-row gap-2">
                <WinnerCell
                  val1={val1 as number}
                  val2={val2 as number}
                  keyName={key}
                  index={index}
                />
              </div>
            </div>
          );
        })}

        {/* Text-only fields — no highlight */}
        {[
          { label: "FEATURES", key: "features" },
          { label: "EXPERT REVIEW", key: "expertReview" },
        ].map(({ label, key }) => (
          <div key={key} className="attribute-row">
            <div className="attribute-header">{label}</div>
            <div className="attribute-values flex flex-col md:flex-row">
              <span className="text-center md:text-left">
                {products1.length > 0
                  ? formatValue(products1[0][key as keyof Product], key)
                  : "N/A"}
              </span>
              <span className="text-center md:text-right">
                {products2.length > 0
                  ? formatValue(products2[0][key as keyof Product], key)
                  : "N/A"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnerCell({
  val1,
  val2,
  keyName,
  index,
}: {
  val1: number | null;
  val2: number | null;
  keyName: string;
  index: number;
}) {
  const safe1 = val1 ?? 0;
  const safe2 = val2 ?? 0;
  const [winner, setWinner] = useState<"left" | "right" | null>(null);

  const higherIsBetter = [
    "puffCount",
    "ml",
    "battery",
    "numberOfFlavours",
  ].includes(keyName);
  const lowerIsBetter = ["price", "pricePerPuff", "pricePerML"].includes(
    keyName
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (safe1 === safe2) {
        setWinner(null);
      } else if (
        (higherIsBetter && safe1 > safe2) ||
        (lowerIsBetter && safe1 < safe2)
      ) {
        setWinner("left");
      } else {
        setWinner("right");
      }
    }, 500 + index * 250); // cascade animation

    return () => clearTimeout(timeout);
  }, [safe1, safe2, keyName, index, higherIsBetter, lowerIsBetter]);

  const baseStyle =
    "w-full block text-center py-1 px-4 rounded-full transition-all duration-500 ease-out scale-95 opacity-80";
  const winnerStyle = "bg-green-200 scale-100 opacity-100 font-semibold";
  const Trophy = () => <span className="ml-1">🏆</span>;

  function formatValue(value: number, key: string): string {
    const keysToFormatAsCurrency = ["price", "pricePerPuff", "pricePerML"];
    if (keysToFormatAsCurrency.includes(key)) {
      if (key === "pricePerPuff") {
        return `$${value.toFixed(4)}`;
      } else {
        return `$${value.toFixed(2)}`;
      }
    }
    return value.toString();
  }

  return (
    <>
      <span className="text-center md:text-left w-full relative">
        <span
          className={`${baseStyle} ${winner === "left" ? winnerStyle : ""}`}
        >
          {formatValue(safe1, keyName)} {winner === "left" && <Trophy />}
        </span>
      </span>
      <span className="text-center md:text-right w-full relative">
        <span
          className={`${baseStyle} ${winner === "right" ? winnerStyle : ""}`}
        >
          {formatValue(safe2, keyName)} {winner === "right" && <Trophy />}
        </span>
      </span>
    </>
  );
}
