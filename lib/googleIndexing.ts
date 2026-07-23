import { JWT } from "google-auth-library";

/**
 * Submits a URL to Google's Indexing API so a newly published/updated page
 * gets crawled faster than waiting for organic discovery via the sitemap.
 * Requires a service account with access to the Search Console property —
 * see the setup notes in the admin UI / project README for how to create one.
 */
export async function submitUrlForIndexing(url: string): Promise<void> {
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is not set — indexing submission is not configured.",
    );
  }

  const credentials = JSON.parse(rawKey) as {
    client_email: string;
    private_key: string;
  };

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const res = await client.request({
    url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
    method: "POST",
    data: { url, type: "URL_UPDATED" },
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Indexing API returned ${res.status}`);
  }
}
