// Submits changed URLs to IndexNow (https://www.indexnow.org) so Bing,
// Yandex, and IndexNow-participating crawlers pick up edits without waiting
// for their own recrawl schedule. Ahrefs' Site Audit flags every changed
// page that was never submitted — this closes that gap by hooking into the
// same two places content already gets revalidated (see revalidate.ts).
//
// Requires an INDEXNOW_KEY env var (any random hex string works — generate
// one with `openssl rand -hex 16`) and that same key served back verbatim at
// https://compare.newcityvapes.com/{key}.txt, which src/app/[key].txt/route.ts
// handles automatically once the env var is set. Until INDEXNOW_KEY exists,
// this is a silent no-op — it never blocks or throws for the caller.
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const HOST = "compare.newcityvapes.com";

export async function submitUrlsToIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `https://${HOST}/${key}.txt`,
        urlList: urls,
      }),
    });

    if (!res.ok) {
      console.error(`IndexNow submission returned ${res.status}`);
    }
  } catch (err) {
    // Best-effort signaling only — never let a search-engine ping fail the
    // revalidation or save it's attached to.
    console.error("IndexNow submission failed:", err);
  }
}
