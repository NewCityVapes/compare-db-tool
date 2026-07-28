import type { Dictionary } from "./en";

const fr: Dictionary = {
  nav: {
    home: "ACCUEIL",
    new: "NOUVEAUTÉS",
    popular: "POPULAIRE",
    hardware: "MATÉRIEL",
    compare: "COMPARER",
    affiliates: "AFFILIÉS",
  },
  common: {
    buyNow: (price: string) => `ACHETER MAINTENANT — ${price} CAD`,
    changeVendorPrompt:
      "Changez l'une des marques ci-dessous pour comparer une autre paire :",
    comparisonSubtitle: "Comparaison de vapoteuses jetables — Canada",
    dataLastUpdated: (date: string) => `Données mises à jour le ${date}`,
    home: "Accueil",
    comparisons: "Comparaisons",
    puffs: "bouffées",
    mlLiquid: "mL de e-liquide",
    mahBattery: "mAh de batterie",
    flavours: "saveurs",
    notAvailable: "N/D",
  },
  attributes: {
    puffCount: "NOMBRE DE BOUFFÉES",
    ml: "ML",
    battery: "BATTERIE",
    price: "PRIX",
    pricePerPuff: "PRIX PAR BOUFFÉE",
    pricePerMl: "PRIX PAR ML",
    numberOfFlavours: "NOMBRE DE SAVEURS",
    features: "CARACTÉRISTIQUES",
    expertReview: "AVIS D'EXPERT",
  },
  combobox: {
    selectVendor: (which: "first" | "second") =>
      which === "first"
        ? "Sélectionner la première marque à comparer"
        : "Sélectionner la deuxième marque à comparer",
    toggleLabel: "Afficher la liste des marques",
    noMatch: (q: string) => `Aucune marque ne correspond à « ${q} ».`,
    loading: "Chargement...",
    scrollTopLabel: "Retour en haut",
    scrollTopText: "↑ Haut",
  },
  distribution: {
    cheaperThan: (pct: number) => `Moins cher que ~${pct}% des produits`,
    min: "Min",
    avg: "Moy",
    max: "Max",
  },
  browse: {
    title: "Toutes les comparaisons de vapoteuses jetables",
    subtitle: (count: number) =>
      `Parcourez ${count} comparaisons côte à côte pour chaque marque de vapoteuse jetable que nous offrons. Cliquez sur une comparaison pour voir les caractéristiques détaillées, les prix et notre verdict d'expert.`,
    metaDescription:
      "Parcourez toutes les comparaisons de vapoteuses jetables. Comparez le nombre de bouffées, le prix et l'autonomie de la batterie pour chaque marque offerte au Canada.",
    searchPlaceholder: "Recherchez une marque, ex. STLTH ou Vice...",
    sortByBrand: "Par marque",
    sortRecentlyUpdated: "Récemment mises à jour",
    noMatches: (q: string) => `Aucune comparaison ne correspond à « ${q} ».`,
  },
  home: {
    title: "Outil de comparaison de vapoteuses jetables",
    subtitle:
      "Comparez le nombre de bouffées, l'autonomie de la batterie, le prix par bouffée et le choix de saveurs, côte à côte, pour chaque marque de vapoteuse jetable que nous offrons au Canada — afin de choisir la bonne avant d'acheter.",
    metaDescription:
      "Comparez les vapoteuses jetables côte à côte parmi les meilleures marques canadiennes. Nombre de bouffées, prix, autonomie de la batterie, prix par bouffée et plus encore.",
    searchPlaceholder: "Trouvez une comparaison, ex. STLTH vs Vice...",
    popularComparisons: "Comparaisons populaires",
    browseAll: "Voir toutes les comparaisons →",
    noResults: (q: string) => `Aucune comparaison trouvée pour « ${q} ».`,
  },
  faqHeading: (v1: string, v2: string) => `FAQ rapide : ${v1} vs ${v2}`,
};

export default fr;
