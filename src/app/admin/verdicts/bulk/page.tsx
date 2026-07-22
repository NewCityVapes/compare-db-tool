import { requireAdmin } from "../../../../../lib/auth";
import BulkImportForm from "./BulkImportForm";

export default async function BulkImportPage() {
  await requireAdmin();

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <a href="/admin/verdicts" className="text-sm text-blue-600 hover:underline">
        ← Back to list
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-1">Bulk import verdicts</h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste a JSON array of <code>{`{ "vendor1", "vendor2", "content" }`}</code>{" "}
        objects — e.g. what you'd ask an LLM to generate in this exact shape.
        Existing verdicts for the same pair are overwritten; new pairs are
        created. Nothing is saved if any item in the array is malformed.
      </p>
      <BulkImportForm />
    </main>
  );
}
