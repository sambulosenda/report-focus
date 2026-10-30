import { legacyDestination } from "@/lib/legacy-redirect";
import { SITE_NAME } from "@/lib/site";

// Old WordPress story addresses (/2019/07/17/my-story/) are rewritten here by next.config.ts.
// Stories from before 2025 were not brought over, so an address with no new home answers "410 Gone":
// search engines drop it sooner than a 404, and readers following an old link are told the story was retired.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  // Next.js has already decoded each part of the address.
  const path = `/${(await params).path.join("/")}`;
  const target = await legacyDestination(path);
  if (target) return new Response(null, { status: 308, headers: { Location: target } });
  return new Response(GONE_PAGE, {
    status: 410,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
  });
}

const GONE_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Story no longer available | ${SITE_NAME}</title>
<style>
body{margin:0;font-family:Georgia,"Times New Roman",serif;color:#111;background:#fff}
main{max-width:640px;margin:0 auto;padding:72px 16px}
p.k{font:800 13px/1 system-ui,sans-serif;letter-spacing:.12em;color:#c8102e;margin:0 0 16px}
h1{font-size:36px;line-height:1.1;margin:0 0 16px}
p{font-size:18px;line-height:1.55;color:#333}
a{color:#004666;font-weight:700}
</style>
</head>
<body>
<main>
<p class="k">410 GONE</p>
<h1>This story is no longer available</h1>
<p>${SITE_NAME} keeps stories from 2025 onwards. Older stories from our previous site have been retired.</p>
<p><a href="/">Go to the homepage</a> or <a href="/search">search our stories</a>.</p>
</main>
</body>
</html>`;
