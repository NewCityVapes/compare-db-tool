import { type Metadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;

  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    title: `${title} | Vape Comparison – New City Vapes`,
    description: `Compare features, flavors, battery, puff count, and expert verdicts between ${title}. Discover which disposable vape comes out on top.`,
    openGraph: {
      title: `${title} | Vape Comparison – New City Vapes`,
      description: `Explore a side-by-side breakdown of ${title} to find the best value vape.`,
      url: `https://compare.newcityvapes.com/compare/${slug}`,
    },
  };
}
