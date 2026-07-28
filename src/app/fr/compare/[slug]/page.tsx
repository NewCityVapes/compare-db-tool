import type { Metadata } from "next";
import {
  getComparisonStaticParams,
  generateComparisonMetadata,
  ComparisonPageContent,
} from "@/app/(en)/compare/[slug]/ComparisonPage";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getComparisonStaticParams();
}

export async function generateMetadata(context: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  return generateComparisonMetadata(slug, "fr");
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug } = await params;
  return ComparisonPageContent({ rawSlug: slug, locale: "fr" });
}
