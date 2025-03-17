import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import "../styles/nextjs-header.css";
import Image from "next/image";

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
          <Image
            src="https://newcityvapes.com/cdn/shop/files/NCV_Logo_High_Resolution_Beige.png?v=1690925690"
            alt="New City Vape Store"
            width={300}
            height={113}
            className="header__heading-logo"
            priority // ✅ Ensures it's loaded first for better performance
            unoptimized // ✅ Allows Shopify-hosted images (CDN images)
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
