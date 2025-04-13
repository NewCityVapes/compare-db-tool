import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const dynamicParams = true; // ✅ Optional but explicit

export async function generateMetadata(context: {
  params: { slug?: string };
}): Promise<Metadata> {
  const params = await context.params;
  const slug = params.slug;

  if (!slug || !slug.includes("-vs-")) {
    return {
      title: "Compare Disposables | New City Vapes",
      description:
        "Explore side-by-side vape comparisons across top disposable brands.",
    };
  }

  // Split slug into two vendor names
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

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
