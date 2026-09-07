// Serves the IndexNow key-verification file's contents. Reached via the
// middleware rewrite in middleware.ts, which maps the literal
// /{key}.txt path IndexNow requires to this route — a normal dynamic
// segment named "[key].txt" breaks Next's route-handler type generation
// (the `.txt` suffix in the folder name confuses its param inference),
// so the URL shape lives in middleware instead of the route tree.
// See lib/indexnow.ts for where the key is submitted from.
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  const indexNowKey = process.env.INDEXNOW_KEY;

  if (!indexNowKey || key !== indexNowKey) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(indexNowKey, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
