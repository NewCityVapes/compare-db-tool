import type { Metadata } from "next";
import { generateHomeMetadata, HomePageContent } from "./HomePage";

// Real homepage — this used to be a permanent redirect straight to one
// hardcoded comparison page, which meant the domain root had no indexable
// content of its own and no homepage authority signal for Google.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return generateHomeMetadata("en");
}

export default async function HomePage() {
  return HomePageContent({ locale: "en" });
}
