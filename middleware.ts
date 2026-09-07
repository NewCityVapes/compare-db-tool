import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// IndexNow requires its verification key to be served at the literal path
// /{key}.txt. A route folder named "[key].txt" looks like the obvious way
// to do that in the App Router, but it breaks Next 16's route-handler type
// generation (see the removed src/app/[key].txt — the .txt suffix in the
// segment name confuses its param inference and fails `next build`). This
// rewrites the same URL shape to a normal, safely-typed API route instead.
export function middleware(request: NextRequest) {
  const match = /^\/([^/]+)\.txt$/.exec(request.nextUrl.pathname);
  if (!match) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/api/indexnow-key";
  url.searchParams.set("key", match[1]);
  return NextResponse.rewrite(url);
}

// Broad matcher (path-to-regexp doesn't cleanly express "any single
// segment ending in .txt") — the regex inside middleware() does the real
// filtering, this just skips Next's own internal asset paths.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
