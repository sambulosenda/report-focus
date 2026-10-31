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
const out = flag("--out", "artifacts/perf/images.json");
const concurrency = Number(flag("--concurrency", "6"));
const runs = Number(flag("--runs", "5"));

const claim =
  "Homepage image optimizer, concurrency 6, the way a browser opens connections. " +
  "The cold batch is the first visit after the image cache is empty. " +
  "The warm median is a repeat visit. " +
  "A cold batch above 500ms, or one image above half of that batch, is the fix. " +
  "A non-200 image invalidates the run.";

async function imageUrls() {
  const response = await fetch(`${base}/`, { cache: "no-store" });
  const html = await response.text();
  const found = new Set();
  for (const match of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    for (const part of match[1].split(",")) {
      const raw = part.trim().split(/\s+/)[0];
      const decoded = raw.replaceAll("&amp;", "&");
      if (decoded.includes("/_next/image")) found.add(decoded);
    }
  }
  return [...found];
}

async function one(path) {
  const started = performance.now();
  const response = await fetch(new URL(path, base), { cache: "no-store" });
  const ttfbMs = performance.now() - started;
  const body = Buffer.from(await response.arrayBuffer());
  const totalMs = performance.now() - started;
  return {
    path,
    status: response.status,
    ttfbMs: Math.round(ttfbMs * 10) / 10,
    totalMs: Math.round(totalMs * 10) / 10,
    bytes: body.length,
    type: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    ok: response.status === 200 && body.length > 100,
  };
}

async function batch(urls) {
  const started = performance.now();
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await one(urls[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
  return {
    wallMs: Math.round((performance.now() - started) * 10) / 10,
    images: results,
    errors: results.filter((row) => !row.ok).length,
    slowestMs: Math.max(...results.map((row) => row.totalMs)),
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const urls = await imageUrls();
const cold = await batch(urls);
const warm = [];
for (let index = 0; index < runs; index += 1) warm.push(await batch(urls));
const walls = warm.map((row) => row.wallMs);
const sorted = [...walls].sort((a, b) => a - b);

const report = {
  claim,
  measuredAt: new Date().toISOString(),
  base,
  loadAverage: loadavg(),
  concurrency,
  imageCount: urls.length,
  cold,
  warm: warm.map(({ images, ...row }) => row),
  warmWallMedianMs: walls.length ? Math.round(median(walls) * 10) / 10 : null,
  warmWallMinMs: sorted[0] ?? null,
  warmWallMaxMs: sorted[sorted.length - 1] ?? null,
  warmErrors: warm.reduce((sum, row) => sum + row.errors, 0),
};

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2));
console.log(
  `images ${urls.length}  cold wall ${cold.wallMs} ms  slowest ${cold.slowestMs} ms  errors ${cold.errors}  warm median ${report.warmWallMedianMs} ms  range ${report.warmWallMinMs}-${report.warmWallMaxMs}  warm errors ${report.warmErrors}`,
);
console.log(out);
