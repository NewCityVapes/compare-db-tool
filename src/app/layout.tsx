import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../app/globals.css";
import Script from "next/script";
import "../styles/nextjs-header.css";
import Image from "next/image";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ FIX: Use template-based title so child pages OVERRIDE instead of DUPLICATE
// ✅ FIX: Removed hardcoded description — each page sets its own
export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "Disposable Vape Comparison Tool | New City Vapes",
  },
  description:
    "Compare disposable vapes side-by-side. Find the best puff count, price, battery life and more across top Canadian brands.",
  icons: {
    icon: "/favicon.ico",
  },
  // ✅ FIX: robots belongs in metadata API, NOT as a manual <meta> tag
  robots: {
    index: true,
    follow: true,
  },
  // ✅ FIX: OG defaults so no page is ever missing Open Graph tags
  openGraph: {
    siteName: "New City Vapes Compare",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "https://compare.newcityvapes.com/logo.png",
        width: 300,
        height: 113,
        alt: "New City Vapes",
      },
    ],
  },
  twitter: {
    card: "summary",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
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

        {/* ❌ REMOVED: <link rel="canonical" href="https://compare.newcityvapes.com" />
            This was stamping the SAME canonical on ALL 2,823 pages.
            Each page now sets its own canonical via metadata.alternates.canonical */}

        {/* ❌ REMOVED: <meta name="robots" content="index, follow" />
            Moved to metadata export above to prevent duplicate tags */}

        {/* ❌ REMOVED: Shopify global.js — this was injecting duplicate title/meta tags
            and slowing down pages. The CSS is kept for styling. */}
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
      <body
        className={`${roboto.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ Announcement Wrapper - Groups Both Bars */}
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
            alt="New City Vape Store"
            width={300}
            height={113}
            className="header__heading-logo"
            priority
            unoptimized
          />

          {/* ✅ Home Link & Navigation — added COMPARE link for internal linking */}
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
            <a href="https://compare.newcityvapes.com/browse">COMPARE</a>
            <a href="https://newcityvapes.goaffpro.com/">AFFILIATES</a>
          </nav>
        </div>

        {/* ✅ Main Content */}
        <main className="content-wrapper">{children}</main>
      </body>
    </html>
  );
}
