//*                           COMMAND TO RUN SCRIPT TO UPDATE SCRIPT FOR SUPABASE DB  *//
//*                               node scripts/syncShopify.mjs                ((()((((())))))) **//
"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toSlug } from "../../../../lib/utils";
import { supabase } from "../../../../lib/supabase-browser"; // ✅ Safe for frontend

export default function ClientOnlyRender({
  vendor1,
  vendor2,
}: {
  vendor1: string;
  vendor2: string;
}) {
  const router = useRouter();

  const slug = `${toSlug(decodeURIComponent(vendor1))}-vs-${toSlug(
    decodeURIComponent(vendor2)
  )}`;

  const [redirecting, setRedirecting] = useState(true);
  const [rawVendor1, setRawVendor1] = useState("");
  const [rawVendor2, setRawVendor2] = useState("");

  const [selectedVendor1, setSelectedVendor1] = useState("");
  const [selectedVendor2, setSelectedVendor2] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);
  const [products1, setProducts1] = useState<Product[]>([]);
  const [products2, setProducts2] = useState<Product[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);

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
      setShowScrollTop(window.scrollY > 300); // Show after 300px scroll
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
    []
  );

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
      console.log("🔍 Slug used to fetch verdict:", slug);

      const { data, error } = await supabase
        .from("verdicts")
        .select("content")
        .eq("slug", slug)
        .maybeSingle();

      console.log("🧪 Raw verdict fetch:", data);

      if (error) {
        console.error("❌ Supabase verdict error:", error.message);
        setVerdict(null);
        return;
      }

      const content = data?.content;

      console.log("🧪 typeof content:", typeof content);
      console.log("🧪 content value:", content);
      console.log("🧪 content length:", content?.trim().length);

      if (typeof content === "string" && content.trim().length > 0) {
        console.log("✅ Setting verdict:", content);
        setVerdict(content);
      } else {
        console.warn("⚠ Verdict found, but 'content' is not a valid string");
        setVerdict(null);
      }
    }

    const slug = `${toSlug(selectedVendor1)}-vs-${toSlug(selectedVendor2)}`;
    console.log("🔍 Slug used in frontend fetch:", JSON.stringify(slug)); // <= This shows any hidden characters

    fetchVerdict();
  }, [selectedVendor1, selectedVendor2]);

  if (redirecting) return null;

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
    collectionHandle?: string; // ✅ Add this line
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
                href={`https://newcityvapes.com/collections/${
                  item.products[0].collectionHandle || toSlug(item.vendor)
                }`}
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

        <div className="flex flex-col items-center justify-center mt-10 py-10 px-6 rounded-xl bg-[#2E323B] shadow-xl border border-[#CB9D64] animate-pulse-slow text-center font-roboto text-[#E5E5E5]">
          {/* Logo replaces the trophy icon */}

          <Image
            src="/NCV_Icon_Beige.png"
            alt="New City Vapes Logo"
            width={64}
            height={64}
            className="mb-4"
          />
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#CB9D64] tracking-wide uppercase">
            New City Vapes Verdict
          </h2>
          <p className="mt-4 text-2xl md:text-3xl font-semibold">
            The Winner is{" "}
            <span className="text-[#CB9D64] font-extrabold">
              {winCounts.left > winCounts.right
                ? selectedVendor1
                : selectedVendor2}{" "}
              🏆
            </span>
          </p>
        </div>

        {/* Skip rendering client-side verdict since it's already rendered server-side */}
      </div>
    </div>
  );
}

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
    keyName
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
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
    }, 500 + index * 250);

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
