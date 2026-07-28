import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Script from "next/script";
import "../../styles/nextjs-header.css";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { getDictionary } from "../../../lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

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

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "Outil de comparaison de vapoteuses jetables | New City Vapes",
  },
  description:
    "Comparez les vapoteuses jetables côte à côte. Trouvez le meilleur nombre de bouffées, prix, autonomie de batterie et plus au Canada.",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "New City Vapes Compare",
    type: "website",
    locale: "fr_CA",
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

// The second of two independent root layouts (see src/app/(en)/layout.tsx
// for why the site is split this way rather than sharing one root layout
// with runtime locale detection). Everything under /fr renders through
// this one, so the locale is always "fr" — no detection needed.
export default function FrenchRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const dict = getDictionary("fr");

  return (
    <html lang="fr-CA">
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

        <link
          rel="stylesheet"
          href="https://newcityvapes.com/cdn/shop/t/1/assets/base.css"
        />

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
        <div className="announcement-wrapper">
          <div className="announcement-bar warning-bar">
            AVERTISSEMENT : LES PRODUITS DE VAPOTAGE CONTIENNENT DE LA
            NICOTINE, UNE SUBSTANCE CHIMIQUE QUI CRÉE UNE FORTE DÉPENDANCE. -
            SANTÉ CANADA
          </div>
          <div className="announcement-bar shipping-bar">
            LIVRAISON GRATUITE SUR LES COMMANDES DE 50 $ ET PLUS
          </div>
        </div>

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

          {/* Labels translated; hrefs to newcityvapes.com itself stay
              pointed at the English store since it has no French version
              yet — only the in-app COMPARE link points into /fr. */}
          <nav className="home-nav">
            <a href="https://newcityvapes.com/" className="home-link">
              {dict.nav.home}
            </a>
            <a href="https://newcityvapes.com/collections/newest-arrivals">
              {dict.nav.new}
            </a>
            <a href="https://newcityvapes.com/collections/top-sellers">
              {dict.nav.popular}
            </a>
            <a href="https://newcityvapes.com/collections/hardware">
              {dict.nav.hardware}
            </a>
            <a href="https://compare.newcityvapes.com/fr/browse">
              {dict.nav.compare}
            </a>
            <a href="https://newcityvapes.goaffpro.com/">
              {dict.nav.affiliates}
            </a>
            <LanguageToggle />
          </nav>
        </div>

        <main className="content-wrapper">{children}</main>
      </body>
    </html>
  );
}
