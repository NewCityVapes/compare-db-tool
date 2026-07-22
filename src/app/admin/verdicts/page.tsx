import { requireAdmin } from "../../../../lib/auth";
import { getComparisonsWithVerdictStatus } from "../../../../lib/comparisons";
import VerdictsListClient from "./VerdictsListClient";

export const dynamic = "force-dynamic";

export default async function VerdictsListPage() {
  await requireAdmin();

  const comparisons = await getComparisonsWithVerdictStatus();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Verdicts</h1>
        <a
          href="/admin/verdicts/bulk"
          className="text-sm text-blue-600 hover:underline"
        >
          Bulk import →
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {comparisons.filter((c) => c.hasVerdict).length} of{" "}
        {comparisons.length} comparison pages have a verdict.
      </p>
      <VerdictsListClient comparisons={comparisons} />
    </main>
  );
}
