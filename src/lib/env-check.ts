type Env = Record<string, string | undefined>;

/**
 * Settings production can't run correctly without. Each fallback in the code is fine on a laptop but wrong live:
 * a missing SITE_URL points every canonical link at localhost, a missing DATABASE_URL serves an empty local file.
 */
export function envProblems(env: Env): string[] {
  const problems: string[] = [];
  const need = (name: string, why: string) => { if (!env[name]?.trim()) problems.push(`${name} is not set: ${why}`); };

  need("SITE_URL", "canonical links, sitemaps and share cards would point at localhost.");
  if (env.SITE_URL && !/^(https:\/\/[^/]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)(\/|$)/.test(env.SITE_URL))
    problems.push(`SITE_URL must start with https:// (got "${env.SITE_URL}").`);

  need("DATABASE_URL", "the site would read an empty local database file.");
  if (/^(libsql|https):\/\//.test(env.DATABASE_URL ?? "")) need("DATABASE_AUTH_TOKEN", "the remote database rejects every query without it.");

  if (env.SITE_TIMEZONE) {
    try { new Intl.DateTimeFormat("en", { timeZone: env.SITE_TIMEZONE }); }
    catch { problems.push(`SITE_TIMEZONE "${env.SITE_TIMEZONE}" is not a known time zone.`); }
  }

  if (env.S3_BUCKET) need("S3_PUBLIC_URL", "readers would get no address for uploaded images.");

  if (env.TIPS_ENCRYPTION_KEY?.trim() && Buffer.from(env.TIPS_ENCRYPTION_KEY.trim(), "base64").length !== 32)
    problems.push("TIPS_ENCRYPTION_KEY must be 32 bytes of base64: tips could not be saved.");

  const provider = (env.EMAIL_PROVIDER || "console").toLowerCase();
  if (!["console", "resend"].includes(provider)) problems.push(`EMAIL_PROVIDER "${env.EMAIL_PROVIDER}" is not "console" or "resend".`);
  if (provider === "resend") {
    need("RESEND_API_KEY", "sign-ups would show but no email would send.");
    need("CRON_SECRET", "the scheduled newsletter send would be refused.");
  }
  return problems;
}
