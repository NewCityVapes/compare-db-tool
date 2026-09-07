import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitUrlsToIndexNow } from "./indexnow";

describe("submitUrlsToIndexNow", () => {
  const originalKey = process.env.INDEXNOW_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async () => new Response(null, { status: 200 }));
  });

  afterEach(() => {
    process.env.INDEXNOW_KEY = originalKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("does nothing when INDEXNOW_KEY is not set", async () => {
    delete process.env.INDEXNOW_KEY;

    await submitUrlsToIndexNow(["https://compare.newcityvapes.com/browse"]);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when the url list is empty", async () => {
    process.env.INDEXNOW_KEY = "test-key";

    await submitUrlsToIndexNow([]);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts the url list with the key and key location when configured", async () => {
    process.env.INDEXNOW_KEY = "test-key";
    const urls = [
      "https://compare.newcityvapes.com/compare/stlth-vs-vice",
      "https://compare.newcityvapes.com/fr/compare/stlth-vs-vice",
    ];

    await submitUrlsToIndexNow(urls);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      host: "compare.newcityvapes.com",
      key: "test-key",
      keyLocation: "https://compare.newcityvapes.com/test-key.txt",
      urlList: urls,
    });
  });

  it("swallows a failed request instead of throwing", async () => {
    process.env.INDEXNOW_KEY = "test-key";
    global.fetch = vi.fn(async () => new Response(null, { status: 500 }));

    await expect(
      submitUrlsToIndexNow(["https://compare.newcityvapes.com/browse"]),
    ).resolves.toBeUndefined();
  });

  it("swallows a network error instead of throwing", async () => {
    process.env.INDEXNOW_KEY = "test-key";
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });

    await expect(
      submitUrlsToIndexNow(["https://compare.newcityvapes.com/browse"]),
    ).resolves.toBeUndefined();
  });
});
