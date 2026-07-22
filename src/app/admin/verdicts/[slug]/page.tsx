import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { getComparisonDetail } from "../../../../../lib/comparisons";
import VerdictEditForm from "./VerdictEditForm";

export const dynamic = "force-dynamic";

export default async function VerdictEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();

  const { slug } = await params;
  const detail = await getComparisonDetail(slug);
  if (!detail) return notFound();

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <a href="/admin/verdicts" className="text-sm text-blue-600 hover:underline">
        ← Back to list
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-1">
        {detail.vendor1} vs {detail.vendor2}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        <a
          href={`/compare/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          /compare/{slug} ↗
        </a>
      </p>
      <VerdictEditForm
        slug={slug}
        vendor1={detail.vendor1}
        vendor2={detail.vendor2}
        initialContent={detail.content}
      />
    </main>
  );
}
