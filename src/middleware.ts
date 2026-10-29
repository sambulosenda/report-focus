import { NextResponse, type NextRequest } from "next/server";

// Fast gate: bounce signed-out visitors before rendering. Real session checks happen on the server in requireUser().
export function middleware(req: NextRequest) {
  if (!req.cookies.has("rf_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/newsroom/:path*"] };
