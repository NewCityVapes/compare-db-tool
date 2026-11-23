import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../../lib/auth";
import {
  translateVerdictToFrench,
  TranslationError,
} from "../../../../../lib/translate";

// A long verdict takes a while to translate.
export const maxDuration = 300;

const MAX_INPUT_CHARS = 200_000;

/**
 * Returns a French *draft* of the posted English HTML. Saves nothing — the
 * admin reviews it in the editor and saves it through /api/verdicts/fr.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json().catch(() => ({}));
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json(
      { error: "There is no English content to translate." },
      { status: 400 },
    );
  }
  if (content.length > MAX_INPUT_CHARS) {
    return NextResponse.json({ error: "Content is too large." }, { status: 413 });
  }

  try {
    const contentFr = await translateVerdictToFrench(content, {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_TRANSLATE_MODEL || undefined,
    });
    return NextResponse.json({ contentFr });
  } catch (err) {
    const message =
      err instanceof TranslationError ? err.message : "Translation failed.";
    if (!(err instanceof TranslationError)) console.error("Translate error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
