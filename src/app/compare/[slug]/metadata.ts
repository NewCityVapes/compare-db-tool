import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [vendor1, vendor2] = params.slug.split("-vs-").map(decodeURIComponent);

  const title = `${vendor1} vs ${vendor2} - Disposable Vape Comparison | New City Vapes`;
  const description = `Compare specs, puffs, battery, and pricing of ${vendor1} and ${vendor2} disposable vapes. Find out which is better!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://compare.newcityvapes.com/compare/${params.slug}`,
    },
  };
}
