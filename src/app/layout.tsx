import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ShopifyLayout from "../app/components/ShopifyLayout"; // ✅ Import Shopify Layout Component
import "../styles/nextjs-header.css"; // Ensure the path is correct

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Load Shopify's CSS files */}
        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/component-list-menu.css"
        />
        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/component-search.css"
        />
        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/component-mega-menu.css"
        />

        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/base.css"
        />

        {/* ✅ Load Shopify's JavaScript files */}
        <Script
          src="https://newcityvapes.com/cdn/shop/t/1/assets/global.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://newcityvapes.com/cdn/shop/t/1/assets/cart-notification.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://newcityvapes.com/cdn/shop/t/1/assets/search-form.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://newcityvapes.com/cdn/shop/t/1/assets/cart-drawer.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ Force Header to Load Correctly */}
        <header id="shopify-header">
          <ShopifyLayout type="header" />
        </header>

        {/* ✅ Main Content Wrapper (Pushes Footer Down) */}
        <main className="content-wrapper">{children}</main>

        {/* ✅ Footer (Ensure it's at the Bottom) */}
        <footer id="shopify-footer">
          <ShopifyLayout type="footer" />
        </footer>
      </body>
    </html>
  );
}
