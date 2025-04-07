import CompareClient from "./Client";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;

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

export default function Page() {
  return <CompareClient />;
}
