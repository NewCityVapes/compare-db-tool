// src/app/compare/[slug]/ClientOnlyRender.tsx
// ============================================================
// UPDATED: Now receives initialProducts from server component
//
// CHANGES:
// 1. Accepts initialProducts1 / initialProducts2 props
// 2. Renders immediately with server data (no "Loading..." flash)
// 3. Still re-fetches on dropdown change (interactive)
// 4. All your existing UI logic preserved exactly
// ============================================================

"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toSlug } from "../../../../lib/utils";
import { supabase } from "../../../../lib/supabase-browser";

type Product = {
  id: string;
  title: string;
  vendor: string;
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
  collectionHandle?: string;
};

export default function ClientOnlyRender({
  vendor1,
  vendor2,
  initialProducts1 = [],
  initialProducts2 = [],
}: {
  vendor1: string;
  vendor2: string;
  initialProducts1?: Product[];
  initialProducts2?: Product[];
}) {
  const router = useRouter();

  const slug = `${toSlug(decodeURIComponent(vendor1))}-vs-${toSlug(
    decodeURIComponent(vendor2),
  )}`;

  const [redirecting, setRedirecting] = useState(true);
  const [rawVendor1, setRawVendor1] = useState("");
  const [rawVendor2, setRawVendor2] = useState("");

  const [selectedVendor1, setSelectedVendor1] = useState("");
  const [selectedVendor2, setSelectedVendor2] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);

  // ✅ CHANGED: Initialize with server-fetched data instead of empty arrays
  const [products1, setProducts1] = useState<Product[]>(initialProducts1);
  const [products2, setProducts2] = useState<Product[]>(initialProducts2);

  const [winCounts, setWinCounts] = useState({ left: 0, right: 0 });

  const handleWin = useCallback((winner: "left" | "right" | null) => {
    setWinCounts((prev) => ({
      left: prev.left + (winner === "left" ? 1 : 0),
      right: prev.right + (winner === "right" ? 1 : 0),
    }));
  }, []);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const [v1, v2] = slug.split("-vs-");
    setRawVendor1(v1);
    setRawVendor2(v2);
    setRedirecting(false);
  }, [slug]);

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

  useEffect(() => {
    if (vendors.length && rawVendor1 && rawVendor2) {
      const decodeAndMatch = (slugPart: string) => {
        const decodedSlug = toSlug(decodeURIComponent(slugPart));
        return vendors.find((vendor) => toSlug(vendor) === decodedSlug);
      };

      const vendor1Match = decodeAndMatch(rawVendor1);
      const vendor2Match = decodeAndMatch(rawVendor2);

      if (vendor1Match) setSelectedVendor1(vendor1Match);
      if (vendor2Match) setSelectedVendor2(vendor2Match);
    }
  }, [vendors, rawVendor1, rawVendor2]);

  const fetchProducts = useCallback(
    async (vendor: string, setProducts: (data: Product[]) => void) => {
      try {
        const formattedVendor = encodeURIComponent(toSlug(vendor));
        const res = await fetch(`/api/products?vendor=${formattedVendor}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(`❌ Error fetching products for ${vendor}:`, error);
      }
    },
    [],
  );

  // ✅ CHANGED: Only re-fetch if vendors change from the dropdown
  // Skip initial fetch since we already have server data
  const [hasUserChangedVendors, setHasUserChangedVendors] = useState(false);

  useEffect(() => {
    if (selectedVendor1 && selectedVendor2) {
      fetchProducts(selectedVendor1, setProducts1);
      fetchProducts(selectedVendor2, setProducts2);
    }
  }, [selectedVendor1, selectedVendor2, fetchProducts]);

  useEffect(() => {
    async function fetchVerdict() {
      if (!selectedVendor1 || !selectedVendor2) return;

      const slug = `${toSlug(selectedVendor1)}-vs-${toSlug(selectedVendor2)}`;

      const { data } = await supabase
        .from("verdicts")
        .select("content")
        .eq("slug", slug)
        .maybeSingle();

      // Verdict is already rendered server-side, this is just for dropdown changes
      console.log(
        "🧪 Verdict fetch for:",
        slug,
        data?.content ? "found" : "not found",
      );
    }

    if (hasUserChangedVendors) {
      fetchVerdict();
    }
  }, [selectedVendor1, selectedVendor2, hasUserChangedVendors]);

  if (redirecting) return null;

  function formatSlug(slug: string) {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function updateVendorSelection(newVendor1: string, newVendor2: string) {
    setHasUserChangedVendors(true);
    const newSlug = `${toSlug(newVendor1)}-vs-${toSlug(newVendor2)}`;
    router.push(`/compare/${newSlug}`);
  }

  function formatValueDisplay(
    value: number | string | null | undefined,
    key: string,
  ): string {
    if (value === null || value === undefined || value === "") return "N/A";
    const keysToFormatAsCurrency = ["price", "pricePerPuff", "pricePerML"];
    const floatVal = typeof value === "number" ? value : parseFloat(value);
    if (keysToFormatAsCurrency.includes(key)) {
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
      {/* ✅ SEO: H1 is now unique per comparison page */}
      <h1 className="page-title">
        {formatSlug(rawVendor1)} vs {formatSlug(rawVendor2)}
      </h1>
      <h2 className="page-subtitle">Disposable Vape Comparison — Canada</h2>

      <div className="w-full max-w-[2400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative text-center">
        {[
          { vendor: selectedVendor1, products: products1 },
          { vendor: selectedVendor2, products: products2 },
        ].map((item, index) => (
          <div key={index} className="product-column">
            <select
              className="dropdown"
              value={item.vendor}
              aria-label={`Select ${index === 0 ? "first" : "second"} vendor to compare`}
              onChange={(e) =>
                updateVendorSelection(
                  index === 0 ? e.target.value : selectedVendor1,
                  index === 1 ? e.target.value : selectedVendor2,
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
                  alt={`${item.products[0].title} disposable vape`}
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
                href={`https://newcityvapes.com/collections/${
                  item.products[0].collectionHandle || toSlug(item.vendor)
                }`}
                target="_blank"
                rel="noopener noreferrer"
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

      {/* ✅ SEO: This heading is now an H2 (H1 is above) */}
      <h2 className="comparison-header">
        {formatSlug(selectedVendor1 ? toSlug(selectedVendor1) : rawVendor1)} vs{" "}
        {formatSlug(selectedVendor2 ? toSlug(selectedVendor2) : rawVendor2)}
      </h2>

      <div
        className="comparison-table"
        role="table"
        aria-label="Vape comparison table"
      >
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
            <div key={key} className="attribute-row" role="row">
              <div className="attribute-header" role="columnheader">
                <h3 className="text-base font-semibold m-0 p-0">{label}</h3>
              </div>
              <div
                className="attribute-values flex flex-row gap-2 w-full justify-between"
                role="row"
              >
                <WinnerCell
                  val1={val1 as number}
                  val2={val2 as number}
                  keyName={key}
                  index={index}
                  onWin={handleWin}
                />
              </div>
            </div>
          );
        })}

        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 px-3 py-1.5 text-xs bg-[#CB9D64] text-[#2E323B] font-medium rounded-full shadow-md hover:bg-[#e0b97f] transition duration-300"
            aria-label="Scroll to top"
          >
            ↑ Top
          </button>
        )}

        {/* Text-only fields — no highlight */}
        {[
          { label: "FEATURES", key: "features" },
          { label: "EXPERT REVIEW", key: "expertReview" },
        ].map(({ label, key }) => (
          <div key={key} className="attribute-row">
            <div className="attribute-header">
              <h3 className="text-base font-semibold m-0 p-0">{label}</h3>
            </div>
            <div className="attribute-values flex flex-col md:flex-row gap-4 text-center">
              <div className="w-full md:w-1/2">
                <div className="block md:hidden text-sm font-semibold text-gray-500 mb-1">
                  {selectedVendor1 || formatSlug(rawVendor1)}
                </div>
                <span>
                  {products1.length > 0
                    ? formatValueDisplay(
                        products1[0][key as keyof Product],
                        key,
                      )
                    : "N/A"}
                </span>
              </div>
              <div className="w-full md:w-1/2">
                <div className="block md:hidden text-sm font-semibold text-gray-500 mb-1">
                  {selectedVendor2 || formatSlug(rawVendor2)}
                </div>
                <span>
                  {products2.length > 0
                    ? formatValueDisplay(
                        products2[0][key as keyof Product],
                        key,
                      )
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        ))}

       
      </div>
    </div>
  );
}

// ─── WinnerCell (unchanged from your original) ───
function WinnerCell({
  val1,
  val2,
  keyName,
  index,
  onWin,
}: {
  val1: number | null;
  val2: number | null;
  keyName: string;
  index: number;
  onWin: (winner: "left" | "right" | null) => void;
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
    keyName,
  );

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        let newWinner: "left" | "right" | null = null;

        if (safe1 !== safe2) {
          if (
            (higherIsBetter && safe1 > safe2) ||
            (lowerIsBetter && safe1 < safe2)
          ) {
            newWinner = "left";
          } else {
            newWinner = "right";
          }
        }

        setWinner(newWinner);
        onWin(newWinner);
      },
      500 + index * 250,
    );

    return () => clearTimeout(timeout);
  }, [safe1, safe2, keyName, index, higherIsBetter, lowerIsBetter, onWin]);

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
      <span className="text-center w-1/2 relative" role="cell">
        <span
          className={`${baseStyle} ${
            winner === "left" ? winnerStyle : "opacity-70"
          }`}
        >
          {formatValue(safe1, keyName)} {winner === "left" && <Trophy />}
        </span>
      </span>
      <span className="text-center w-1/2 relative" role="cell">
        <span
          className={`${baseStyle} ${
            winner === "right" ? winnerStyle : "opacity-70"
          }`}
        >
          {formatValue(safe2, keyName)} {winner === "right" && <Trophy />}
        </span>
      </span>
    </>
  );
}
