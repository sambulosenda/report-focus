import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir, loadavg } from "node:os";
import { join, dirname } from "node:path";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const base = flag("--base", "http://127.0.0.1:3107").replace(/\/$/, "");
const out = flag("--out", "artifacts/perf/browser.json");
const runs = Number(flag("--runs", "5"));
const only = flag("--only", "both");
const throttle = flag("--throttle", "");
const port = 9333;
const chromeBin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const claim =
  "Chrome loads the homepage the way a reader does, including the srcset image it actually picks. " +
  "Run 1 is a cold browser. Later runs reuse that profile. " +
  "A warm median loadEventEnd above 500ms, or a batch of image responses above half of that, is the fix. " +
  "An image status other than 200 invalidates that run.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.next = 1;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result ?? {});
        return;
      }
      if (message.method) this.events.push(message);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.next++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }
}

async function waitForBrowser() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return response.json();
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  throw new Error("Chrome did not open a debug port");
}

function summarizeNavigation(events, sessionId) {
  const mine = events.filter((event) => event.sessionId === sessionId);
  const requests = new Map();
  for (const event of mine) {
    if (event.method === "Network.requestWillBeSent") {
      requests.set(event.params.requestId, {
        url: event.params.request.url,
        start: event.params.timestamp,
      });
    }
    if (event.method === "Network.responseReceived") {
      const row = requests.get(event.params.requestId);
      if (!row) continue;
      row.status = event.params.response.status;
      row.mime = event.params.response.mimeType;
    }
    if (event.method === "Network.loadingFinished") {
      const row = requests.get(event.params.requestId);
      if (!row) continue;
      row.ms = Math.round((event.params.timestamp - row.start) * 1000);
      row.bytes = event.params.encodedDataLength;
    }
  }
  const rows = [...requests.values()];
  const images = rows.filter((row) => row.url.includes("/_next/image"));
  const failed = images.filter((row) => row.status && row.status !== 200);
  const widths = images.map((row) => {
    const match = row.url.match(/[?&]w=(\d+)/);
    return match ? Number(match[1]) : null;
  });
  const slowest = [...rows]
    .filter((row) => row.ms != null)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 12)
    .map((row) => ({
      url: row.url.replace(base, ""),
      ms: row.ms,
      bytes: row.bytes ?? 0,
      status: row.status ?? 0,
      mime: row.mime ?? "",
    }));
  return {
    requests: rows.length,
    slowest,
    imageCount: images.length,
    imageErrors: failed.length,
    imageBytes: images.reduce((sum, row) => sum + (row.bytes ?? 0), 0),
    slowestImageMs: images.reduce((max, row) => Math.max(max, row.ms ?? 0), 0),
    widths: [...new Set(widths.filter((width) => width != null))].sort((a, b) => a - b),
    loaded: mine.some((event) => event.method === "Page.loadEventFired"),
  };
}

async function navigationTiming(cdp, sessionId) {
  const result = await cdp.send(
    "Runtime.evaluate",
    {
      expression: `JSON.stringify((() => {
        const nav = performance.getEntriesByType("navigation")[0];
        if (!nav) return null;
        return {
          ttfbMs: nav.responseStart,
          domContentLoadedMs: nav.domContentLoadedEventEnd,
          loadMs: nav.loadEventEnd,
          transferSize: nav.transferSize,
          encodedBodySize: nav.encodedBodySize,
        };
      })())`,
      returnByValue: true,
    },
    sessionId,
  );
  return result.result?.value ? JSON.parse(result.result.value) : null;
}

async function runViewport(cdp, viewport) {
  const created = await cdp.send("Target.createTarget", { url: "about:blank" });
  const attached = await cdp.send("Target.attachToTarget", { targetId: created.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  if (throttle === "slow-4g") {
    await cdp.send(
      "Network.emulateNetworkConditions",
      {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      },
      sessionId,
    );
  }
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.dpr,
      mobile: viewport.mobile,
    },
    sessionId,
  );
  const samples = [];
  for (let index = 0; index < runs; index += 1) {
    const from = cdp.events.length;
    await cdp.send("Page.navigate", { url: `${base}/` }, sessionId);
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const fired = cdp.events.slice(from).some((event) => event.method === "Page.loadEventFired" && event.sessionId === sessionId);
      if (fired) break;
      await sleep(40);
    }
    await cdp.send(
      "Runtime.evaluate",
      { expression: "window.scrollTo(0, document.body.scrollHeight)", awaitPromise: true },
      sessionId,
    );
    await sleep(1000);
    const network = summarizeNavigation(cdp.events.slice(from), sessionId);
    const timing = await navigationTiming(cdp, sessionId);
    samples.push({ ...network, timing });
  }
  await cdp.send("Target.closeTarget", { targetId: created.targetId });
  return samples;
}

function median(values) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const profile = await mkdtemp(join(tmpdir(), "rf-chrome-"));
const chrome = spawn(
  chromeBin,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-extensions",
    "--disable-background-networking",
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  const version = await waitForBrowser();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("Chrome socket failed")));
  });
  const cdp = new Cdp(ws);
  const desktop = only === "phone" ? null : await runViewport(cdp, { width: 1280, height: 800, dpr: 2, mobile: false });
  const phone = only === "desktop" ? null : await runViewport(cdp, { width: 390, height: 844, dpr: 3, mobile: true });
  ws.close();

  function pack(label, samples) {
    const warm = samples.slice(1);
    const loads = warm.map((sample) => sample.timing?.loadMs);
    const sorted = [...loads].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    return {
      label,
      samples,
      warmLoadMedianMs: median(loads),
      warmLoadMinMs: sorted[0] ?? null,
      warmLoadMaxMs: sorted[sorted.length - 1] ?? null,
      imageErrors: samples.reduce((sum, sample) => sum + sample.imageErrors, 0),
    };
  }

  const report = {
    claim,
    throttle: throttle || "none",
    measuredAt: new Date().toISOString(),
    base,
    loadAverage: loadavg(),
    runs,
    desktop: desktop ? pack("desktop-1280-dpr2", desktop) : null,
    phone: phone ? pack("phone-390-dpr3", phone) : null,
  };
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(report, null, 2));
  for (const side of [report.desktop, report.phone]) {
    if (!side) continue;
    const first = side.samples[0];
    console.log(
      `${side.label}  cold load ${first.timing?.loadMs ?? "n/a"} ms  warm median ${side.warmLoadMedianMs} ms  range ${side.warmLoadMinMs}-${side.warmLoadMaxMs}  cold images ${first.imageCount} widths ${first.widths.join(",")}  slowest image ${first.slowestImageMs} ms  errors ${side.imageErrors}`,
    );
  }
  console.log(out);
} finally {
  chrome.kill("SIGKILL");
  await rm(profile, { recursive: true, force: true });
}
