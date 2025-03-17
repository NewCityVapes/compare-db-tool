import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ShopifyLayout from "../app/components/ShopifyLayout";
import "../styles/nextjs-header.css";

// ✅ Fetch Shopify Header Server-Side
async function getShopifyHeader() {
  try {
    const res = await fetch("http://localhost:3000/api/shopify-header");
    if (!res.ok) throw new Error("Failed to load Shopify header");
    return await res.text();
  } catch (error) {
    console.error("Error loading Shopify header:", error);
    return ""; // ✅ Return empty string on failure
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New City Vapes - Disposables Review",
  description: "Compare different disposable vapes find the best reviews",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const shopifyHeader = await getShopifyHeader(); // ✅ Fetch header before rendering

  return (
    <html lang="en">
      <head>
        {/* ✅ Load Shopify's JavaScript & CSS */}
        <Script
          src="https://newcityvapes.com/cdn/shop/t/1/assets/global.js"
          strategy="afterInteractive"
        />
        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/base.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ Warning Bar */}
        <div className="announcement-bar warning-bar">
          WARNING: VAPING PRODUCTS CONTAIN NICOTINE, A HIGHLY ADDICTIVE
          CHEMICAL. - HEALTH CANADA
        </div>

        {/* ✅ Free Shipping Bar */}
        <div className="announcement-bar shipping-bar">
          FREE SHIPPING ON ORDERS OVER $50
        </div>

        {/* ✅ Inject Shopify Header Instantly */}
        <div id="shopify-header">
          <img
            src="//newcityvapes.com/cdn/shop/files/NCV_Logo_High_Resolution_Beige.png?v=1690925690"
            alt="New City Vape Store"
            width="300"
            height="113"
            className="header__heading-logo"
          />

          {/* ✅ Home Link Under Logo */}
          <nav className="home-nav">
            <a href="https://newcityvapes.com/" className="home-link">
              HOME
            </a>
            <a href="https://newcityvapes.com/collections/newest-arrivals">
              NEW
            </a>
            <a href="https://newcityvapes.com/collections/top-sellers">
              POPULAR
            </a>
            <a href="https://newcityvapes.com/collections/hardware">HARDWARE</a>
            <a href="https://newcityvapes.goaffpro.com/">AFFILIATES</a>
          </nav>
        </div>

        {/* ✅ Main Content */}
        <main className="content-wrapper">{children}</main>
      </body>
    </html>
  );
}
