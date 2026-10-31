#!/usr/bin/env node
// Drives one isolated Report Focus dev server. Run from anywhere; paths are based on this file.
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO = path.resolve(SKILL_DIR, "../../..");
const EVIDENCE = path.join(SKILL_DIR, "evidence");
const RUNS = path.join(SKILL_DIR, "runs");
const NEXT_BIN = path.join(REPO, "node_modules", ".bin", "next");

const LEAD_TITLE = "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding";
const LEAD_PATH = "/climate/storm-system-brings-record-rainfall-to-the-gulf-coast-as-crews-prepare-for-flooding";

const id = process.env.VERIFY_ID || "current";
const port = Number(process.env.VERIFY_PORT || 4173);
const runDir = path.join(RUNS, id);
const statePath = path.join(runDir, "state.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readState() {
  if (!existsSync(statePath)) fail(`doctor fail\nno state file at ${statePath}. Run launch first.`);
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // A different session can see the process and still be refused the signal.
    return err && err.code === "EPERM";
  }
}

function otherLiveRuns() {
  if (!existsSync(RUNS)) return [];
  const found = [];
  for (const name of readdirSync(RUNS)) {
    const file = path.join(RUNS, name, "state.json");
    if (!existsSync(file)) continue;
    const state = JSON.parse(readFileSync(file, "utf8"));
    if (alive(state.pid)) found.push(state);
  }
  return found;
}

function portFree(check) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(check, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: REPO, env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    child.stderr.on("data", (chunk) => {
      out += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${path.basename(cmd)} ${args.join(" ")} exited ${code}\n${out}`));
    });
  });
}

function isolatedEnv(state) {
  return {
    ...process.env,
    DATABASE_URL: `file:${state.dbPath}`,
    DATABASE_AUTH_TOKEN: "",
    UPLOAD_DIR: state.uploadDir,
    SITE_URL: state.url,
    EMAIL_PROVIDER: "console",
    SEED_PASSWORD: "newsroom-demo-2026",
    SITE_TIMEZONE: "America/New_York",
    NEXT_PUBLIC_SITE_TIMEZONE: "America/New_York",
    NEXT_TELEMETRY_DISABLED: "1",
    WATCHPACK_POLLING: "true",
    CHOKIDAR_USEPOLLING: "1",
    SENTRY_DSN: "",
    NEXT_PUBLIC_SENTRY_DSN: "",
    S3_BUCKET: "",
    S3_PUBLIC_URL: "",
  };
}

function killGroup(pid) {
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

function listenerPid(checkPort) {
  const found = spawnSync("lsof", ["-nP", `-iTCP:${checkPort}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  const pid = Number(String(found.stdout || "").trim().split("\n")[0]);
  return Number.isInteger(pid) && pid > 0 ? pid : 0;
}

async function waitReady(url) {
  const deadline = Date.now() + 180_000;
  let last = "no response yet";
  while (Date.now() < deadline) {
    try {
      const health = await fetch(`${url}/api/health`);
      const healthBody = await health.text();
      if (!health.ok) {
        last = `health ${health.status} ${healthBody}`;
      } else {
        const home = await fetch(`${url}/`);
        const html = await home.text();
        if (home.ok && html.includes(LEAD_TITLE)) return;
        last = home.ok ? "homepage did not include the seeded lead" : `homepage ${home.status}`;
      }
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
    await sleep(400);
  }
  throw new Error(`launch failed: server did not become usable within 180s (${last}). Log: ${path.join(runDir, "server.log")}`);
}

async function launch() {
  if (!existsSync(NEXT_BIN)) fail("launch failed: install dependencies with npm install first.");
  const busy = otherLiveRuns();
  if (busy.length) {
    fail(`launch refused: verification server already running (pid ${busy.map((s) => s.pid).join(", ")}). One checkout shares .next, so a second server would corrupt it. Run cleanup first.`);
  }
  if (!(await portFree(port))) fail(`launch refused: 127.0.0.1:${port} is already in use. Set VERIFY_PORT to a free port.`);

  mkdirSync(runDir, { recursive: true });
  const uploadDir = path.join(runDir, "uploads");
  mkdirSync(uploadDir, { recursive: true });
  const dataDirExisted = existsSync(path.join(REPO, "data"));
  const state = {
    id,
    pid: 0,
    port,
    url: `http://127.0.0.1:${port}`,
    dbPath: path.join(runDir, "report-focus.db"),
    uploadDir,
    dataDirExisted,
    leadTitle: LEAD_TITLE,
    leadPath: LEAD_PATH,
  };
  const env = isolatedEnv(state);
  await run(process.execPath, ["--import", "tsx", "scripts/migrate.ts"], env);
  const seeded = await run(process.execPath, ["--import", "tsx", "scripts/seed.ts"], env);
  if (!seeded.includes("Seeded Report Focus")) fail(`launch failed: seed did not load a fresh database.\n${seeded}`);

  const logFd = openSync(path.join(runDir, "server.log"), "a");
  const child = spawn(NEXT_BIN, ["dev", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: REPO,
    env,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();
  state.pid = child.pid;
  writeFileSync(statePath, JSON.stringify(state, null, 2));
  try {
    await waitReady(state.url);
    state.listenPid = listenerPid(port);
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    killGroup(state.pid);
    let tail = "";
    const logPath = path.join(runDir, "server.log");
    if (existsSync(logPath)) tail = readFileSync(logPath, "utf8").slice(-2000);
    rmSync(runDir, { recursive: true, force: true });
    throw new Error(`${err instanceof Error ? err.message : String(err)}\n${tail}`);
  }
  console.log(`ready ${state.url}`);
  console.log(`pid=${state.pid}`);
  console.log(`data=${state.dbPath}`);
}

async function doctor() {
  const state = readState();
  if (!alive(state.pid)) fail(`doctor fail\npid ${state.pid} is not running. Log: ${path.join(runDir, "server.log")}`);
  const healthRes = await fetch(`${state.url}/api/health`);
  const health = await healthRes.json().catch(() => null);
  if (!healthRes.ok || !health?.ok) fail(`doctor fail\nhealth ${healthRes.status} at ${state.url}/api/health`);
  const home = await fetch(`${state.url}/`);
  const html = await home.text();
  if (!home.ok || !html.includes(state.leadTitle)) fail("doctor fail\nhomepage is up but the seeded lead story is missing. The database is not the seeded verification database.");
  const version = JSON.parse(readFileSync(path.join(REPO, "package.json"), "utf8")).version;
  console.log("doctor ok");
  console.log(`url=${state.url}`);
  console.log(`pid=${state.pid}`);
  console.log(`data=${state.dbPath}`);
  console.log(`version=${version}`);
  console.log(`lead=${state.leadTitle}`);
}

function argValues(flag) {
  const values = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === flag && process.argv[i + 1]) values.push(process.argv[++i]);
  }
  return values;
}

async function get(pathname) {
  const state = readState();
  if (!alive(state.pid)) fail(`get failed: pid ${state.pid} is not running.`);
  const manual = process.argv.includes("--manual");
  const url = new URL(pathname, state.url);
  const res = await fetch(url, { redirect: manual ? "manual" : "follow" });
  const body = manual ? "" : await res.text();
  const expects = argValues("--expect");
  const missing = expects.filter((text) => !body.includes(text));
  const statusWanted = argValues("--expect-status")[0];
  const locationWanted = argValues("--expect-location")[0];
  const location = res.headers.get("location") ?? "";
  const save = argValues("--save")[0];
  if (save) {
    mkdirSync(EVIDENCE, { recursive: true });
    const htmlPath = path.join(EVIDENCE, `${save}.html`);
    const metaPath = path.join(EVIDENCE, `${save}.meta.json`);
    if (!manual) writeFileSync(htmlPath, body);
    writeFileSync(
      metaPath,
      JSON.stringify(
        {
          url: url.toString(),
          status: res.status,
          finalUrl: res.url,
          location: res.headers.get("location"),
          expects,
          missing,
          savedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(`saved ${manual ? metaPath : htmlPath}`);
  }
  console.log(`status=${res.status}`);
  console.log(`final=${manual ? url.toString() : res.url}`);
  if (location) console.log(`location=${location}`);
  if (statusWanted && String(res.status) !== statusWanted) fail(`get failed: status ${res.status}, expected ${statusWanted}`);
  if (locationWanted && !location.includes(locationWanted)) fail(`get failed: location ${location || "(none)"} does not contain ${locationWanted}`);
  if (missing.length) fail(`get failed: response missing ${missing.map((text) => JSON.stringify(text)).join(", ")}`);
  if (!manual && expects.length === 0 && !res.ok) fail(`get failed: status ${res.status}`);
}

async function cleanup() {
  if (!existsSync(statePath)) {
    console.log("cleanup ok");
    console.log("nothing to stop");
    return;
  }
  const state = readState();
  const pids = [...new Set([state.pid, state.listenPid].filter((pid) => pid && alive(pid)))];
  for (const pid of pids) killGroup(pid);
  for (let i = 0; i < 20 && pids.some((pid) => alive(pid)); i++) await sleep(100);
  for (const pid of pids.filter((pid) => alive(pid))) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        /* already gone */
      }
    }
  }
  if (pids.some((pid) => alive(pid))) fail(`cleanup failed: pid ${pids.join(", ")} is still running`);
  rmSync(runDir, { recursive: true, force: true });
  if (!state.dataDirExisted) {
    const dataDir = path.join(REPO, "data");
    if (existsSync(dataDir) && readdirSync(dataDir).length === 0) rmSync(dataDir, { recursive: true, force: true });
  }
  console.log("cleanup ok");
  console.log(`stopped pid ${state.pid}`);
  console.log(`evidence left at ${EVIDENCE}`);
}

const [command, pathname] = process.argv.slice(2);
const commands = { launch, doctor, get: () => get(pathname), cleanup };
if (!commands[command] || (command === "get" && !pathname)) {
  fail("usage: control.mjs launch | doctor | get <path> [--manual] [--expect text] [--expect-status code] [--expect-location text] [--save name] | cleanup");
}
commands[command]().catch((err) => fail(err instanceof Error ? err.message : String(err)));
