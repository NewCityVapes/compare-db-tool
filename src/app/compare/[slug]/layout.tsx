import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata(context: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;

  if (!slug || !slug.includes("-vs-")) {
    return {
      title: "Compare Disposables | New City Vapes",
      description:
        "Explore side-by-side vape comparisons across top disposable brands.",
    };
  }

  const [raw1, raw2] = slug.split("-vs-");

  const formatVendor = (vendor: string) =>
    decodeURIComponent(vendor)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const vendor1 = formatVendor(raw1);
  const vendor2 = formatVendor(raw2);
  const title = `${vendor1} vs ${vendor2}`;

  return {
    title: `${title} | Vape Comparison – New City Vapes`,
    description: `Compare features, battery life, puff count, price, and expert verdicts between ${vendor1} and ${vendor2}.`,
    openGraph: {
      title: `${title} | Vape Comparison – New City Vapes`,
      description: `Explore a side-by-side breakdown of ${title} to find the best value vape.`,
      url: `https://compare.newcityvapes.com/compare/${slug}`,
    },
  };
}

// ✅ REQUIRED default export: the layout component
export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>; // ✅ MUST return JSX
}
