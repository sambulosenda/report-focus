import assert from "node:assert/strict";
import { test } from "node:test";
import { envProblems } from "../src/lib/env-check";

const live = {
  SITE_URL: "https://reportfocusnews.com",
  DATABASE_URL: "libsql://db.turso.io",
  DATABASE_AUTH_TOKEN: "token",
  SITE_TIMEZONE: "Africa/Harare",
  S3_BUCKET: "media",
  S3_PUBLIC_URL: "https://media.reportfocusnews.com",
  EMAIL_PROVIDER: "console",
};

test("the live settings pass", () => {
  assert.deepEqual(envProblems(live), []);
});

test("each broken setting is named", () => {
  const cases: [Record<string, string | undefined>, RegExp][] = [
    [{ SITE_URL: undefined }, /SITE_URL is not set/],
    [{ SITE_URL: "http://reportfocusnews.com" }, /SITE_URL must start with https/],
    [{ DATABASE_URL: undefined }, /DATABASE_URL is not set/],
    [{ DATABASE_AUTH_TOKEN: "" }, /DATABASE_AUTH_TOKEN/],
    [{ SITE_TIMEZONE: "Africa/Harrare" }, /not a known time zone/],
    [{ S3_PUBLIC_URL: undefined }, /S3_PUBLIC_URL/],
    [{ TIPS_ENCRYPTION_KEY: "short" }, /TIPS_ENCRYPTION_KEY/],
    [{ EMAIL_PROVIDER: "resnd" }, /EMAIL_PROVIDER/],
    [{ EMAIL_PROVIDER: "resend" }, /RESEND_API_KEY/],
  ];
  for (const [change, expected] of cases) {
    const problems = envProblems({ ...live, ...change });
    assert.ok(problems.some((p) => expected.test(p)), `${JSON.stringify(change)} -> ${JSON.stringify(problems)}`);
  }
});

test("a local production run needs no token, https or time zone", () => {
  const local = { SITE_URL: "http://localhost:3000", DATABASE_URL: "file:./data/x.db" };
  assert.deepEqual(envProblems(local), []);
});
