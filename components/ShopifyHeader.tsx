"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function ShopifyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // 🔄 Simulate fetching cart count (Replace with API call)
    setCartCount(3); // TODO: Replace with actual cart count from backend
  }, []);

  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-md">
      {/* ✅ Top Announcement Bar */}
      <div className="bg-black text-white text-center py-2 text-sm">
        🚚 **FREE SHIPPING** on orders over **$75**
      </div>

      {/* ✅ Main Header Section */}
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* 🍔 Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-700 text-2xl"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* 🏪 Logo (Centered on Desktop) */}
        <Link href="/">
          <img src="/shopify-logo.png" alt="NewCityVapes" className="h-14" />
        </Link>

        {/* 🔍 Search Bar (Hidden on Mobile) */}
        <div className="hidden md:flex items-center border border-gray-300 rounded-lg px-3 py-2 w-1/3">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full outline-none bg-transparent text-gray-700"
          />
          <FaSearch className="text-gray-500" />
        </div>

        {/* 👤 User & Cart Icons */}
        <div className="flex items-center space-x-6">
          <Link href="/account">
            <FaUser className="text-gray-700 text-2xl hover:text-black cursor-pointer" />
          </Link>
          <Link href="/cart" className="relative">
            <FaShoppingCart className="text-gray-700 text-2xl hover:text-black cursor-pointer" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ✅ Navigation Menu (Dropdown on Mobile) */}
      <nav
        className={`md:flex items-center justify-center bg-white md:shadow-none shadow-md transition-all duration-300 ${
          menuOpen ? "block" : "hidden"
        } border-t border-gray-200`}
      >
        <div className="container mx-auto flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-8 p-4 md:p-0">
          <Link href="/" className="text-gray-700 hover:text-black text-lg">
            Home
          </Link>
          <Link href="/shop" className="text-gray-700 hover:text-black text-lg">
            Shop
          </Link>
          <Link
            href="/brands"
            className="text-gray-700 hover:text-black text-lg"
          >
            Brands
          </Link>
          <Link
            href="/disposables"
            className="text-gray-700 hover:text-black text-lg"
          >
            Disposables
          </Link>
          <Link
            href="/about"
            className="text-gray-700 hover:text-black text-lg"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="text-gray-700 hover:text-black text-lg"
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
