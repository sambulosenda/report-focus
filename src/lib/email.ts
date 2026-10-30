import "server-only";

/**
 * Sending email. The provider is chosen with EMAIL_PROVIDER so it can be swapped without touching the rest of the app:
 * - "resend": sends through Resend (set RESEND_API_KEY)
 * - "console" (the default): prints each message to the server log, for local work before a provider is chosen
 * To add another provider, write a function with the same shape as sendWithResend and add it to PROVIDERS.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

type Provider = (from: string, messages: EmailMessage[]) => Promise<void>;

const RESEND_BATCH = 100;

const sendWithResend: Provider = async (from, messages) => {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  // The batch endpoint takes up to 100 messages per call.
  for (let i = 0; i < messages.length; i += RESEND_BATCH) {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(messages.slice(i, i + RESEND_BATCH).map((m) => ({ from, ...m }))),
    });
    if (!res.ok) throw new Error(`Resend refused the batch (${res.status}): ${await res.text()}`);
  }
};

const logToConsole: Provider = async (from, messages) => {
  for (const m of messages) console.info(`[email] ${from} -> ${m.to}: ${m.subject}\n${m.text}\n`);
};

const PROVIDERS: Record<string, Provider> = { resend: sendWithResend, console: logToConsole };

export function emailProvider() {
  const name = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  return PROVIDERS[name] ? name : "console";
}

/** True when email really leaves the building, as opposed to being printed to the log. */
export const emailIsLive = () => emailProvider() !== "console";

export async function sendEmails(messages: EmailMessage[]) {
  if (messages.length === 0) return;
  const from = process.env.EMAIL_FROM || "Report Focus News <news@reportfocusnews.com>";
  await PROVIDERS[emailProvider()](from, messages);
}
