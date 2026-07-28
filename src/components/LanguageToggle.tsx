"use client";

import { usePathname } from "next/navigation";
import { parseLocaleFromPath } from "../../lib/i18n/locale";

/**
 * Swaps the CURRENT page's locale rather than always linking home — clicking
 * FR on /compare/stlth-vs-vice goes to /fr/compare/stlth-vs-vice, not /fr.
 * A plain <a> (not next/link) so the request round-trips through the server
 * and gets the correct locale's data (verdict/description content differs
 * per language, so this can't be a client-side route transition).
 */
export default function LanguageToggle() {
  const pathname = usePathname() || "/";
  const { locale, rest } = parseLocaleFromPath(pathname);

  const otherHref = locale === "fr" ? rest : `/fr${rest === "/" ? "" : rest}`;
  const otherLabel = locale === "fr" ? "EN" : "FR";

  return (
    <a
      href={otherHref}
      className="language-toggle"
      aria-label={
        locale === "fr" ? "Switch to English" : "Passer au français"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "12px",
        padding: "4px 12px",
        borderRadius: "999px",
        border: "1px solid #CB9D64",
        color: "#CB9D64",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        textDecoration: "none",
      }}
    >
      {otherLabel}
    </a>
  );
}
