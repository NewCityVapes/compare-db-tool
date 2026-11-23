import { describe, it, expect } from "vitest";
import {
  cleanVerdictForTranslation,
  stripCodeFences,
  localizeInternalLinks,
  translateVerdictToFrench,
  TranslationError,
} from "./translate";

function fakeFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return (async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  })) as unknown as typeof fetch;
}

describe("cleanVerdictForTranslation", () => {
  it("drops scripts, comments and stray citation markers", () => {
    const dirty = `<!-- SEO Meta -->\n<script type="application/ld+json">{"a":1}</script>\n<p>Hi</p> ::contentReference[oaicite:1]{index=1}`;
    expect(cleanVerdictForTranslation(dirty)).toBe("<p>Hi</p>");
  });
});

describe("stripCodeFences", () => {
  it("removes ```html fences", () => {
    expect(stripCodeFences("```html\n<p>x</p>\n```")).toBe("<p>x</p>");
    expect(stripCodeFences("<p>x</p>")).toBe("<p>x</p>");
  });
});

describe("localizeInternalLinks", () => {
  it("points compare/browse links at /fr but leaves store links alone", () => {
    const out = localizeInternalLinks(
      '<a href="/compare/a-vs-b">x</a><a href="/browse">y</a>' +
        '<a href="https://compare.newcityvapes.com/compare/c-vs-d">z</a>' +
        '<a href="https://newcityvapes.com/collections/stlth">s</a>' +
        '<a href="/fr/compare/e-vs-f">already</a>',
    );
    expect(out).toContain('href="/fr/compare/a-vs-b"');
    expect(out).toContain('href="/fr/browse"');
    expect(out).toContain(
      'href="https://compare.newcityvapes.com/fr/compare/c-vs-d"',
    );
    expect(out).toContain('href="https://newcityvapes.com/collections/stlth"');
    expect(out).not.toContain("/fr/fr/");
  });
});

describe("translateVerdictToFrench", () => {
  it("returns the cleaned, link-localized translation", async () => {
    const result = await translateVerdictToFrench("<p>Hello</p>", {
      apiKey: "k",
      fetchImpl: fakeFetch({
        stop_reason: "end_turn",
        content: [
          { type: "text", text: '```html\n<p>Bonjour <a href="/compare/a-vs-b">x</a></p>\n```' },
        ],
      }),
    });
    expect(result).toBe('<p>Bonjour <a href="/fr/compare/a-vs-b">x</a></p>');
  });

  it("fails clearly without an API key", async () => {
    await expect(translateVerdictToFrench("<p>x</p>")).rejects.toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("fails on API errors and truncated output instead of returning junk", async () => {
    await expect(
      translateVerdictToFrench("<p>x</p>", {
        apiKey: "k",
        fetchImpl: fakeFetch({ error: "bad" }, { ok: false, status: 500 }),
      }),
    ).rejects.toBeInstanceOf(TranslationError);

    await expect(
      translateVerdictToFrench("<p>x</p>", {
        apiKey: "k",
        fetchImpl: fakeFetch({
          stop_reason: "max_tokens",
          content: [{ type: "text", text: "<p>partial" }],
        }),
      }),
    ).rejects.toThrow(/cut off/);
  });
});
