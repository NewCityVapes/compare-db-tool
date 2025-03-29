//*                           COMMAND TO RUN SCRIPT TO UPDATE SCRIPT FOR SUPABASE DB  *//
//*                               node scripts/syncShopify.mjs                ((()((((())))))) **//

"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../../../lib/supabase-browser"; // anon version for browser

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();

  const slug = params?.slug as string;

  const [redirecting, setRedirecting] = useState(true);
  const [rawVendor1, setRawVendor1] = useState("");
  const [rawVendor2, setRawVendor2] = useState("");

  const [selectedVendor1, setSelectedVendor1] = useState("");
  const [selectedVendor2, setSelectedVendor2] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);
  const [products1, setProducts1] = useState<Product[]>([]);
  const [products2, setProducts2] = useState<Product[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const [v1, v2] = slug.split("-vs-") || [];
    const normalizedSlug = `${toSlug(decodeURIComponent(v1))}-vs-${toSlug(
      decodeURIComponent(v2)
    )}`;

    if (slug !== normalizedSlug) {
      router.replace(`/compare/${normalizedSlug}`);
    } else {
      setRawVendor1(v1);
      setRawVendor2(v2);
      setRedirecting(false);
    }
  }, [slug, router]);

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
        const decoded = decodeURIComponent(slugPart).toLowerCase();
        return vendors.find((vendor) => toSlug(vendor) === decoded);
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
        const formattedVendor = encodeURIComponent(vendor.trim().toLowerCase());
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
    async function fetchVerdict() {
      if (!selectedVendor1 || !selectedVendor2) return;

      const slug = `${toSlug(selectedVendor1)}-vs-${toSlug(selectedVendor2)}`;

      const { data, error } = await supabase
        .from("verdicts")
        .select("content")
        .eq("slug", slug)
        .single();

      if (error) {
        console.warn("No verdict found or Supabase error", error);
        setVerdict(null);
      } else {
        setVerdict(data.content);
      }
    }

    fetchVerdict();
  }, [selectedVendor1, selectedVendor2]);

  useEffect(() => {
    if (selectedVendor1 && selectedVendor2) {
      fetchProducts(selectedVendor1, setProducts1);
      fetchProducts(selectedVendor2, setProducts2);
    }
  }, [selectedVendor1, selectedVendor2, fetchProducts]);

  if (redirecting) return null;

  function toSlug(str: string) {
    return str.toLowerCase().replace(/\s+/g, "-");
  }

  function formatSlug(slug: string) {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function updateVendorSelection(vendor1: string, vendor2: string) {
    const newSlug = `${toSlug(vendor1)}-vs-${toSlug(vendor2)}`;
    router.push(`/compare/${newSlug}`);
  }

  function formatValue(
    value: number | string | null | undefined,
    key: string
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

  type Product = {
    id: string;
    title: string;
    vendor: string; // ✅ Add this line
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

  return (
    <div className="comparison-container">
      <h1 className="page-title">Disposable Comparison Review</h1>
      <h2 className="page-subtitle">Which Vape is Better?</h2>

      <div className="w-full max-w-[2400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative text-center">
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
                href={`https://newcityvapes.com/collections/${toSlug(
                  item.products[0].vendor
                )}`}
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

      <h2 className="comparison-header">
        {formatSlug(selectedVendor1)} vs {formatSlug(selectedVendor2)}
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
              <div className="attribute-values flex flex-row gap-2 w-full justify-between">
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
            <div className="attribute-values flex flex-col md:flex-row gap-4 text-center">
              <div className="w-full md:w-1/2">
                <div className="block md:hidden text-sm font-semibold text-gray-500 mb-1">
                  {selectedVendor1}
                </div>
                <span>
                  {products1.length > 0
                    ? formatValue(products1[0][key as keyof Product], key)
                    : "N/A"}
                </span>
              </div>
              <div className="w-full md:w-1/2">
                <div className="block md:hidden text-sm font-semibold text-gray-500 mb-1">
                  {selectedVendor2}
                </div>
                <span>
                  {products2.length > 0
                    ? formatValue(products2[0][key as keyof Product], key)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        ))}
        {verdict && (
          <div className="verdict-section mt-12 border-t border-gray-300 pt-8 max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Verdict</h3>
            <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
              {verdict}
            </p>
          </div>
        )}
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
    }, 500 + index * 250);

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
      <span className="text-center w-1/2 relative">
        <span
          className={`${baseStyle} ${
            winner === "left" ? winnerStyle : "opacity-70"
          }`}
        >
          {formatValue(safe1, keyName)} {winner === "left" && <Trophy />}
        </span>
      </span>
      <span className="text-center w-1/2 relative">
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
