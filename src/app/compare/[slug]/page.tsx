import { createClient } from "@supabase/supabase-js";
import { toSlug } from "../../../../lib/utils";
import { notFound } from "next/navigation";
import ClientOnlyRender from "./ClientOnlyRender";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug } = await params;

  const [v1, v2] = slug?.split("-vs-") ?? [];
  if (!v1 || !v2) return notFound();

  const vendor1Slug = toSlug(decodeURIComponent(v1));
  const vendor2Slug = toSlug(decodeURIComponent(v2));
  const combinedSlug = `${vendor1Slug}-vs-${vendor2Slug}`;

  const { data: verdictData } = await supabase
    .from("verdicts")
    .select("content")
    .eq("slug", combinedSlug)
    .maybeSingle();

  const verdict = verdictData?.content || "";

  return (
    <>
      {/* Comparison UI goes first */}
      <ClientOnlyRender
        vendor1={decodeURIComponent(v1)}
        vendor2={decodeURIComponent(v2)}
      />

      {/* Verdict goes after full comparison */}
      <div
        className="rich-verdict max-w-4xl mx-auto text-lg leading-relaxed space-y-6 mt-20"
        dangerouslySetInnerHTML={{ __html: verdict }}
      />
    </>
  );
}
