import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log("🔥 Middleware is running! Path:", req.nextUrl.pathname); // Debug log

  if (req.nextUrl.pathname === "/") {
    console.log("➡️ Redirecting to /compare/ALLO ULTRA 2500-vs-VICE BOX 2");
    return NextResponse.redirect(
      new URL("/compare/ALLO%20ULTRA%202500-vs-VICE%20BOX%202", req.url)
    );
  }

  return NextResponse.next();
}

// ✅ Make sure Middleware runs on ALL pages
export const config = {
  matcher: ["/", "/(.*)"], // <-- Now applies to ALL pages
};
