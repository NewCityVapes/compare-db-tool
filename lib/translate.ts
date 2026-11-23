// AI-assisted English → Canadian French translation of verdict HTML, used by
// the admin editor's "Translate with AI" button. The result is only ever
// returned as a *draft* — nothing here writes to the database, so a human
// always reviews and saves it.

export const DEFAULT_TRANSLATE_MODEL = "claude-sonnet-5-5";

const MAX_OUTPUT_TOKENS = 16000;

export const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator producing Canadian French (français canadien) for New City Vapes, a Canadian vape retailer. You translate HTML comparison articles between disposable vape products.

Rules:
1. Output ONLY the translated HTML. No commentary, no markdown, no code fences.
2. Preserve the HTML structure, tags, attributes, inline styles and emoji exactly. Translate only human-readable text, plus the text of alt, title and aria-label attributes.
3. Never translate: brand names, product/model names (e.g. "Geek Bar Pulse X", "STLTH 60K"), flavour names (e.g. "Blue Razz Ice", "Mango Pineapple Ice"), or URLs. Keep href and src values unchanged.
4. Keep every number and spec exactly as written (puff counts, mL, mAh, W). Format thousands with a non-breaking space ("25 000 bouffées") and prices the Canadian French way ("27,99 $ CAD").
5. Vocabulary: puffs → "bouffées"; disposable vape → "vapoteuse jetable"; e-liquid → "e-liquide"; mesh coil → "bobine en maille"; airflow → "débit d'air"; draw-activated → "activation par inhalation"; pros and cons → "avantages et inconvénients"; rechargeable → "rechargeable".
6. Use a natural, fluent Canadian French marketing tone, addressing the reader as "vous". Follow Canadian French typography: a space before ":" but no space before "?" or "!"; use « » for quotations.
7. Keep "vs" as "vs". Keep "New City Vapes" unchanged.
8. If a section is already in French, leave it as is.`;

/** Strips legacy cruft that should not be translated or carried into French. */
export function cleanVerdictForTranslation(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/::contentReference\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Models sometimes wrap output in ```html fences despite instructions. */
export function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

/**
 * Points links to other comparison/browse pages at their /fr equivalents.
 * Done in code rather than trusted to the model so it can't be missed.
 * Links to the main store (newcityvapes.com/collections/…) are left alone,
 * since the store has no French version.
 */
export function localizeInternalLinks(html: string): string {
  return html
    .replace(/href="\/compare\//g, 'href="/fr/compare/')
    .replace(/href="\/browse(?=["/?#])/g, 'href="/fr/browse')
    .replace(
      /href="https:\/\/compare\.newcityvapes\.com\/compare\//g,
      'href="https://compare.newcityvapes.com/fr/compare/',
    )
    .replace(
      /href="https:\/\/compare\.newcityvapes\.com\/browse(?=["/?#])/g,
      'href="https://compare.newcityvapes.com/fr/browse',
    );
}

export class TranslationError extends Error {}

export async function translateVerdictToFrench(
  englishHtml: string,
  opts: {
    apiKey?: string;
    model?: string;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<string> {
  const apiKey = opts.apiKey;
  if (!apiKey) {
    throw new TranslationError(
      "ANTHROPIC_API_KEY is not set. Add it to the Vercel environment variables to enable AI translation.",
    );
  }

  const source = cleanVerdictForTranslation(englishHtml);
  if (!source) {
    throw new TranslationError("There is no English content to translate.");
  }

  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_TRANSLATE_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: TRANSLATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Translate this article into Canadian French:\n\n${source}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new TranslationError(
      `Translation service error (${res.status}). ${detail.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as {
    stop_reason?: string;
    content?: { type: string; text?: string }[];
  };

  if (data.stop_reason === "max_tokens") {
    throw new TranslationError(
      "This article is too long to translate in one pass — the result was cut off, so it was discarded.",
    );
  }

  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("");

  const translated = localizeInternalLinks(stripCodeFences(text));
  if (!translated || !translated.includes("<")) {
    throw new TranslationError("The translation came back empty or malformed.");
  }
  return translated;
}
