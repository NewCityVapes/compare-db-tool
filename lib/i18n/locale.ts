export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** BCP 47 tag for <html lang>, hreflang, and Intl date/number formatting. */
export function localeTag(locale: Locale): string {
  return locale === "fr" ? "fr-CA" : "en-CA";
}

/** Prefixes a path with /fr for French, leaves English unprefixed. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path;
  return locale === "fr" ? `/fr${clean || ""}` : clean || "/";
}

/**
 * Strips a leading /fr segment and reports which locale a raw pathname
 * belongs to — used by the language toggle to compute the other locale's
 * equivalent URL for the current page.
 */
export function parseLocaleFromPath(pathname: string): {
  locale: Locale;
  rest: string;
} {
  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    return { locale: "fr", rest: pathname.slice(3) || "/" };
  }
  return { locale: "en", rest: pathname };
}
