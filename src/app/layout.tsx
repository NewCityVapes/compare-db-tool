// src/app/layout.tsx
// ============================================================
// CHANGES FROM YOUR ORIGINAL:
// 1. Removed hardcoded canonical (now set per-page via generateMetadata)
// 2. Added Organization JSON-LD schema
// 3. Cleaned up: removed unused Geist font imports
// 4. Added global metadata defaults with template
// 5. Everything else (GA, announcement bars, header, nav) UNCHANGED
// ============================================================

import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import "../styles/nextjs-header.css";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { OrganizationJsonLd } from "../components/SEO/JsonLd";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

// ✅ Global metadata defaults — individual pages override via generateMetadata
export const metadata: Metadata = {
  metadataBase: new URL("https://compare.newcityvapes.com"),
  title: {
    default: "Disposable Vape Comparisons | New City Vapes",
    template: "%s", // Pages provide full titles
  },
  description:
    "Compare disposable vapes side-by-side. Find the best disposable vape in Canada by puff count, price, battery life, ML capacity, and more.",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "New City Vapes",
  },
  // ✅ REMOVED: hardcoded canonical — now set per-page
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* ✅ Organization schema — site-wide */}
        <OrganizationJsonLd />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-6WTQEQ7ERQ`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-6WTQEQ7ERQ');
  `}
        </Script>

        {/* ✅ Shopify CSS */}
        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/base.css"
        />

        {/* ✅ Scroll Script to Hide Announcement Bars */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            document.addEventListener("DOMContentLoaded", function () {
              let lastScrollTop = 0;
              window.addEventListener("scroll", function () {
                let scrollTop = window.scrollY || document.documentElement.scrollTop;
                if (scrollTop > 100) {
                  document.body.classList.add("scrolled");
                } else {
                  document.body.classList.remove("scrolled");
                }
                lastScrollTop = scrollTop;
              });
            });
          `,
          }}
        />
      </head>
      <body className={`${roboto.className} antialiased`}>
        {/* ✅ Announcement Wrapper */}
        <div className="announcement-wrapper">
          <div className="announcement-bar warning-bar">
            WARNING: VAPING PRODUCTS CONTAIN NICOTINE, A HIGHLY ADDICTIVE
            CHEMICAL. - HEALTH CANADA
          </div>
          <div className="announcement-bar shipping-bar">
            FREE SHIPPING ON ORDERS OVER $50
          </div>
        </div>

        {/* ✅ Sticky Header */}
        <div id="shopify-header">
          <Image
            src="/logo.png"
            alt="New City Vapes — Canadian Vape Store"
            width={300}
            height={113}
            className="header__heading-logo"
            priority
            unoptimized
          />

          <nav className="home-nav" aria-label="Main navigation">
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
