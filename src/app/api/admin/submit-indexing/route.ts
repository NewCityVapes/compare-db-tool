import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../../lib/auth";
import { submitUrlForIndexing } from "../../../../../lib/googleIndexing";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json().catch(() => ({}));

  if (typeof url !== "string" || !url.startsWith("https://compare.newcityvapes.com/")) {
    return NextResponse.json(
      { error: "Missing or invalid url — must be a compare.newcityvapes.com URL" },
      { status: 400 },
    );
  }

  try {
    await submitUrlForIndexing(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Indexing submission error:", err);
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
