#!/usr/bin/env node
// One command: model-check the claim/send/release steps, then run sendEdition and sendBreakingAlert.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SKILL_DIR, "../../..");
const SYNC = "d0e0ab0b12d9296b3bd0248851d9975cf445a04e";
const COVERED = ["src/lib/newsletters.ts", "src/db/schema.ts", "drizzle/0002_newsletter_alerts.sql"];
const ACTORS = ["editor", "cron"];

function clone(state) {
  return structuredClone(state);
}

function initial() {
  return {
    claim: "absent",
    holder: null,
    sent: 0,
    failures: 0,
    phase: { editor: "idle", cron: "idle" },
    left: { editor: 2, cron: 2 },
  };
}

function explore(step) {
  const start = initial();
  const seen = new Set();
  const queue = [{ state: start, path: [] }];
  let reachedRetry = false;
  while (queue.length) {
    const current = queue.shift();
    const stamp = JSON.stringify(current.state);
    if (seen.has(stamp)) continue;
    seen.add(stamp);
    if (current.state.sent > 1) return { states: seen.size, violation: current.path, reachedRetry };
    if (current.state.failures > 0 && current.state.sent === 1) reachedRetry = true;
    for (const next of step(current.state)) queue.push({ state: next.state, path: [...current.path, next.label] });
  }
  return { states: seen.size, violation: null, reachedRetry };
}

function faithful(state) {
  const next = [];
  for (const actor of ACTORS) {
    if (state.phase[actor] === "idle" && state.left[actor] > 0) {
      const claimed = clone(state);
      claimed.left[actor] -= 1;
      if (claimed.claim === "absent") {
        claimed.claim = "held";
        claimed.holder = actor;
        claimed.phase[actor] = "sending";
        next.push({ label: `${actor} insertClaim won`, state: claimed });
      } else {
        next.push({ label: `${actor} insertClaim lost`, state: claimed });
      }
    }
    if (state.phase[actor] === "sending" && state.holder === actor) {
      const delivered = clone(state);
      delivered.sent += 1;
      delivered.phase[actor] = "idle";
      next.push({ label: `${actor} sendEmails ok`, state: delivered });
      const refused = clone(state);
      refused.failures += 1;
      refused.claim = "absent";
      refused.holder = null;
      refused.phase[actor] = "idle";
      next.push({ label: `${actor} sendEmails fail; deleteClaim`, state: refused });
    }
  }
  return next;
}

function broken(state) {
  const next = [];
  for (const actor of ACTORS) {
    if (state.phase[actor] === "idle" && state.left[actor] > 0) {
      const peeked = clone(state);
      const absent = peeked.claim === "absent";
      peeked.phase[actor] = absent ? "peeked-absent" : "peeked-held";
      next.push({
        label: absent ? `${actor} read email_sends and saw no claim` : `${actor} read email_sends and saw a claim`,
        state: peeked,
      });
    }
    if (state.phase[actor] === "peeked-absent") {
      const wrote = clone(state);
      wrote.left[actor] -= 1;
      wrote.phase[actor] = "sending";
      wrote.claim = "held";
      wrote.holder = actor;
      next.push({ label: `${actor} insertClaim from the earlier read`, state: wrote });
    }
    if (state.phase[actor] === "peeked-held") {
      const lost = clone(state);
      lost.left[actor] -= 1;
      lost.phase[actor] = "idle";
      next.push({ label: `${actor} insertClaim lost`, state: lost });
    }
    if (state.phase[actor] === "sending") {
      const delivered = clone(state);
      delivered.sent += 1;
      delivered.phase[actor] = "idle";
      next.push({ label: `${actor} sendEmails ok`, state: delivered });
    }
  }
  return next;
}

function words(path) {
  return path.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

const good = explore(faithful);
const bad = explore(broken);
let propertyOk = true;

console.log("property: one edition, and one breaking alert, is emailed at most once when an editor and the scheduler overlap. A send that fails deletes its claim so a later try can send.");
if (good.violation) {
  propertyOk = false;
  console.log("model fail: the faithful steps emailed twice:");
  console.log(words(good.violation));
} else if (!good.reachedRetry) {
  propertyOk = false;
  console.log("model fail: no path refused a send and then delivered exactly once.");
} else {
  console.log(`model pass: ${good.states} states, sent never exceeded 1, and a refused send can be retried once.`);
}

if (!bad.violation) {
  propertyOk = false;
  console.log("model fail: the broken check-then-insert never emailed twice, so this check cannot see that bug.");
} else {
  console.log("broken variant (read the claim, then insert later, with no unique index) emailed twice:");
  console.log(words(bad.violation));
}

const drift = spawnSync("git", ["diff", "--exit-code", SYNC, "--", ...COVERED], { cwd: REPO, encoding: "utf8" });
const drifted = drift.status !== 0;

const runsDir = path.join(SKILL_DIR, "runs");
mkdirSync(runsDir, { recursive: true });
const dbDir = mkdtempSync(path.join(runsDir, "db-"));
const env = {
  ...process.env,
  DATABASE_URL: `file:${path.join(dbDir, "report-focus.db")}`,
  DATABASE_AUTH_TOKEN: "",
  EMAIL_PROVIDER: "console",
  EMAIL_FROM: "Report Focus News <news@reportfocusnews.com>",
  SITE_URL: "http://127.0.0.1:4173",
  SITE_TIMEZONE: "America/New_York",
};
const node = process.execPath;
const migrated = spawnSync(node, ["--import", "tsx", "scripts/migrate.ts"], { cwd: REPO, env, encoding: "utf8" });
if (migrated.status !== 0) {
  console.log(migrated.stdout);
  console.log(migrated.stderr);
  rmSync(dbDir, { recursive: true, force: true });
  process.exit(1);
}
const live = spawnSync(node, ["--conditions=react-server", "--import", "tsx", path.join(SKILL_DIR, "live.ts")], { cwd: REPO, env, encoding: "utf8" });
console.log(live.stdout);
if (live.stderr) console.error(live.stderr);
rmSync(dbDir, { recursive: true, force: true });
if (live.status !== 0) propertyOk = false;

if (!propertyOk) process.exit(1);
if (drifted) {
  console.log(`drift: ${COVERED.join(", ")} differ from ${SYNC}. The check passed on this tree. Do not move the sync commit until you confirm the steps still match the code.`);
  process.exit(2);
}
console.log(`sync: ${SYNC}`);
console.log("check pass");
