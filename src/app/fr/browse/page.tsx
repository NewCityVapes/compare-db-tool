import type { Metadata } from "next";
import {
  generateBrowseMetadata,
  BrowsePageContent,
} from "@/app/(en)/browse/BrowsePage";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateBrowseMetadata("fr");
}

export default async function BrowsePage() {
  return BrowsePageContent({ locale: "fr" });
}
