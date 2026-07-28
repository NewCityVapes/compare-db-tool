import type { Locale } from "./locale";
import en from "./dictionaries/en";
import fr from "./dictionaries/fr";

export * from "./locale";
export type { Dictionary } from "./dictionaries/en";

const dictionaries = { en, fr };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
