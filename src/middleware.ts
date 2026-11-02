import { NextResponse, type NextRequest } from "next/server";

const sections = new Set(["zimbabwe", "south-africa", "africa", "world", "politics", "crime", "business", "us", "technology", "health", "climate", "sports", "entertainment"]);

// Fast gate: bounce signed-out visitors before rendering. Real session checks happen on the server in requireUser().
// Section pages also send old ?page=N links to /section/page/N.
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/newsroom")) {
    const page = req.nextUrl.searchParams.get("page");
    if (sections.has(req.nextUrl.pathname.slice(1)) && page && /^\d+$/.test(page) && Number(page) > 1 && Number.isSafeInteger(Number(page))) {
      const url = req.nextUrl.clone();
      url.pathname += `/page/${Number(page)}`;
      url.searchParams.delete("page");
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }
  if (!req.cookies.has("rf_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/newsroom/:path*", "/:path"] };
