import type { Metadata } from "next";
import { generateHomeMetadata, HomePageContent } from "@/app/(en)/HomePage";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return generateHomeMetadata("fr");
}

export default async function HomePage() {
  return HomePageContent({ locale: "fr" });
}
