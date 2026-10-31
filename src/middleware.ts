import { INFO_PAGES, RESERVED_SLUGS } from "@/lib/site";
import { NOT_FOUND_HTML } from "@/lib/not-found-response";
import { NextResponse, type NextRequest } from "next/server";

const known = new Set(["zimbabwe", "south-africa", "africa", "world", "politics", "crime", "business", "us", "technology", "health", "climate", "sports", "entertainment"]);

// Fast gate: bounce signed-out visitors before rendering. Real session checks happen on the server in requireUser().
export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/newsroom")) {
    const page = req.nextUrl.searchParams.get("page");
    if (known.has(req.nextUrl.pathname.slice(1)) && page && /^\d+$/.test(page) && Number(page) > 1 && Number.isSafeInteger(Number(page))) {
      const url = req.nextUrl.clone();
      url.pathname += `/page/${Number(page)}`;
      url.searchParams.delete("page");
      return NextResponse.redirect(url, 308);
    }
    const slug = req.nextUrl.pathname.slice(1);

    // Normal reader routes never make this extra request. Check unknown names so new CMS
    // sections and old WordPress redirects still reach their normal server rendering.
    if (slug && !slug.includes("/") && !slug.includes(".") && !known.has(slug) && !RESERVED_SLUGS.has(slug) && !INFO_PAGES[slug]) {
      try {
        const url = req.nextUrl.clone();
        url.pathname = "/api/route-exists";
        url.search = "";
        url.searchParams.set("slug", slug);
        const result = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (result.ok && (await result.json()).exists === false) {
          return new NextResponse(NOT_FOUND_HTML, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" } });
        }
      } catch { /* Let the normal route handle a lookup outage. */ }
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
