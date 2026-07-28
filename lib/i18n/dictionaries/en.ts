const en = {
  nav: {
    home: "HOME",
    new: "NEW",
    popular: "POPULAR",
    hardware: "HARDWARE",
    compare: "COMPARE",
    affiliates: "AFFILIATES",
  },
  common: {
    buyNow: (price: string) => `BUY NOW — ${price} CAD`,
    changeVendorPrompt:
      "Change either brand below to compare a different pair:",
    comparisonSubtitle: "Disposable Vape Comparison — Canada",
    dataLastUpdated: (date: string) => `Data last updated: ${date}`,
    home: "Home",
    comparisons: "Comparisons",
    puffs: "puffs",
    mlLiquid: "mL e-liquid",
    mahBattery: "mAh battery",
    flavours: "flavours",
    notAvailable: "N/A",
  },
  attributes: {
    puffCount: "PUFF COUNT",
    ml: "ML",
    battery: "BATTERY",
    price: "PRICE",
    pricePerPuff: "PRICE PER PUFF",
    pricePerMl: "PRICE PER ML",
    numberOfFlavours: "NUMBER OF FLAVOURS",
    features: "FEATURES",
    expertReview: "EXPERT REVIEW",
  },
  combobox: {
    selectVendor: (which: "first" | "second") =>
      `Select ${which} vendor to compare`,
    toggleLabel: "Toggle vendor list",
    noMatch: (q: string) => `No vendors match "${q}".`,
    loading: "Loading...",
    scrollTopLabel: "Scroll to top",
    scrollTopText: "↑ Top",
  },
  distribution: {
    cheaperThan: (pct: number) => `Cheaper than ~${pct}% of products`,
    min: "Min",
    avg: "Avg",
    max: "Max",
  },
  browse: {
    title: "All Disposable Vape Comparisons",
    subtitle: (count: number) =>
      `Browse ${count} side-by-side comparisons across every disposable vape brand we carry. Click any comparison to see detailed specs, pricing and our expert verdict.`,
    metaDescription:
      "Browse all disposable vape comparisons. Compare puff count, price, battery life across every brand available in Canada.",
    searchPlaceholder: "Search by brand, e.g. STLTH or Vice...",
    sortByBrand: "By Brand",
    sortRecentlyUpdated: "Recently Updated",
    noMatches: (q: string) => `No comparisons match "${q}".`,
  },
  home: {
    title: "Disposable Vape Comparison Tool",
    subtitle:
      "Compare puff count, battery life, price-per-puff, and flavour selection side-by-side across every disposable vape brand we carry in Canada — so you can pick the right one before you buy.",
    metaDescription:
      "Compare disposable vapes side-by-side across top Canadian brands. Puff count, price, battery life, price-per-puff and more.",
    searchPlaceholder: "Find a comparison, e.g. STLTH vs Vice...",
    popularComparisons: "Popular Comparisons",
    browseAll: "Browse All Comparisons →",
    noResults: (q: string) => `No comparisons found for "${q}".`,
  },
  faqHeading: (v1: string, v2: string) => `Quick Comparison FAQ: ${v1} vs ${v2}`,
};

export default en;
export type Dictionary = typeof en;
