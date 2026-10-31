import { mkdir, writeFile } from "node:fs/promises";
import { loadavg } from "node:os";
import { performance } from "node:perf_hooks";
import { dirname } from "node:path";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const base = flag("--base", "http://127.0.0.1:3107").replace(/\/$/, "");
const runs = Number(flag("--runs", "5"));
const out = flag("--out", "artifacts/perf/baseline.json");

const claim =
  "Production next start, homepage and one story and search, document TTFB. " +
  "A warm median above 300ms, or one phase over half of that, is the fix. " +
  "A warm median under 100ms means the document is not the limiter. " +
  "The noise floor is the warm range. A later change has to beat that range.";

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function hit(path) {
  const url = new URL(path, base).toString();
  const started = performance.now();
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    return { path, url, ok: false, error: String(error) };
  }
  const ttfbMs = performance.now() - started;
  const body = Buffer.from(await response.arrayBuffer());
  const totalMs = performance.now() - started;
  const html = body.toString("utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  return {
    path,
    url: response.url,
    status: response.status,
    ttfbMs: Math.round(ttfbMs * 10) / 10,
    totalMs: Math.round(totalMs * 10) / 10,
    bytes: body.length,
    title,
    cacheControl: response.headers.get("cache-control"),
    nextCache: response.headers.get("x-nextjs-cache"),
    serverTiming: response.headers.get("server-timing"),
    ok: response.status === 200 && title.length > 0 && body.length > 1000,
    html,
  };
}

function articlePath(html) {
  const hrefs = [...html.matchAll(/href="(\/[^"#?]+)"/g)].map((match) => match[1]);
  return (
    hrefs.find(
      (href) =>
        /^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(href) &&
        !href.startsWith("/newsroom") &&
        !href.startsWith("/login"),
    ) ?? null
  );
}

function summarize(label, rows) {
  const publicRows = rows.map(({ html: _html, ...row }) => row);
  const warm = publicRows.slice(1);
  const ttfb = warm.map((row) => row.ttfbMs).filter((value) => Number.isFinite(value));
  const sorted = [...ttfb].sort((a, b) => a - b);
  return {
    label,
    first: publicRows[0] ?? null,
    warm,
    warmTtfbMedianMs: ttfb.length ? Math.round(median(ttfb) * 10) / 10 : null,
    warmTtfbMinMs: sorted[0] ?? null,
    warmTtfbMaxMs: sorted[sorted.length - 1] ?? null,
    errors: publicRows.filter((row) => !row.ok).length,
    requests: publicRows.length,
  };
}

async function sample(label, path) {
  const rows = [];
  for (let index = 0; index < runs + 1; index += 1) {
    rows.push(await hit(path));
  }
  return { summary: summarize(label, rows), html: rows[0]?.html ?? "" };
}

const home = await sample("homepage", "/");
const storyPath = articlePath(home.html);
const story = storyPath ? await sample("story", storyPath) : null;
const latest = await sample("latest", "/latest");
const search = await sample("search", "/search?q=zimbabwe");

const report = {
  claim,
  measuredAt: new Date().toISOString(),
  base,
  loadAverage: loadavg(),
  runsPerPath: runs,
  note: "Request 1 is the first hit after this process started talking to the server. Requests 2 onward are the warm sample. This file does not include a CPU profile.",
  pages: [home.summary, story?.summary ?? { label: "story", error: "no story link on homepage" }, latest.summary, search.summary],
};

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2));

for (const page of report.pages) {
  if (page.error) {
    console.log(`${page.label}  ${page.error}`);
    continue;
  }
  const first = page.first;
  console.log(
    `${page.label}  first ${first?.ttfbMs ?? "err"} ms  warm median ${page.warmTtfbMedianMs} ms  range ${page.warmTtfbMinMs}-${page.warmTtfbMaxMs}  errors ${page.errors}/${page.requests}  status ${first?.status}  bytes ${first?.bytes}  cache ${first?.nextCache ?? first?.cacheControl ?? "none"}`,
  );
}
console.log(out);
