// Serves the IndexNow key-verification file at /{key}.txt. IndexNow requires
// the exact key to be hosted at this path before it will accept submissions
// signed with it — see lib/indexnow.ts. Returns 404 for any value that isn't
// the current INDEXNOW_KEY so this route can't be used to host arbitrary text.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const indexNowKey = process.env.INDEXNOW_KEY;

  if (!indexNowKey || key !== indexNowKey) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(indexNowKey, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
