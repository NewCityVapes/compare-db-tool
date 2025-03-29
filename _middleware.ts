import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log("🔥 Middleware is running! Path:", req.nextUrl.pathname); // Debug log

  if (req.nextUrl.pathname === "/") {
    const normalizedSlug = "stlth-titan-max-disposable-vs-vice-box-2"; // 👈 use normalized slug
    console.log(`➡️ Redirecting to /compare/${normalizedSlug}`);
    return NextResponse.redirect(
      new URL(`/compare/${normalizedSlug}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/(.*)"],
};
