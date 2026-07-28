import type { Metadata } from "next";
import {
  getComparisonStaticParams,
  generateComparisonMetadata,
  ComparisonPageContent,
} from "./ComparisonPage";

// Pages are statically generated for every known vendor pair (see
// generateStaticParams below) and revalidated on-demand when the Shopify
// sync or a verdict save happens (see lib/revalidate.ts). The time-based
// revalidate here is only a safety net in case an on-demand trigger is missed.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getComparisonStaticParams();
}

export async function generateMetadata(context: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  return generateComparisonMetadata(slug, "en");
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug } = await params;
  return ComparisonPageContent({ rawSlug: slug, locale: "en" });
}
