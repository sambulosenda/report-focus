/**
 * Ad and reader-support settings, read from the server's environment at request time,
 * so they can be changed on the host without a rebuild.
 *
 * Ads go live when ADSENSE_CLIENT and the slot ID for a placement are set. A placement
 * without a slot ID shows nothing. NEXT_PUBLIC_AD_SLOTS=on shows grey placeholders
 * instead, for checking the layout before AdSense approves the site.
 */

export type AdPlacement = "home" | "article" | "sidebar";

const SLOT_ENV: Record<AdPlacement, string> = {
  home: "ADSENSE_SLOT_HOME",
  article: "ADSENSE_SLOT_ARTICLE",
  sidebar: "ADSENSE_SLOT_SIDEBAR",
};

export type AdConfig = { mode: "live"; client: string; slot: string } | { mode: "preview" };

/** "ca-pub-1234567890123456", or "" when AdSense isn't set up. */
export function adsenseClient() {
  const client = process.env.ADSENSE_CLIENT?.trim() ?? "";
  return /^ca-pub-\d{10,20}$/.test(client) ? client : "";
}

/** What to show in one ad placement, or null for nothing. */
export function adConfig(placement: AdPlacement): AdConfig | null {
  const client = adsenseClient();
  const slot = process.env[SLOT_ENV[placement]]?.trim() ?? "";
  if (client && /^\d{5,20}$/.test(slot)) return { mode: "live", client, slot };
  if (process.env.NEXT_PUBLIC_AD_SLOTS === "on") return { mode: "preview" };
  return null;
}

/**
 * The same ad as HTML, for placing between paragraphs of a story body that is rendered
 * from Markdown. The values are checked above, so nothing here needs escaping.
 */
export function inlineAdHtml(): string {
  const ad = adConfig("article");
  if (!ad) return "";
  const inner =
    ad.mode === "live"
      ? `<ins class="adsbygoogle" style="display:block" data-ad-client="${ad.client}" data-ad-slot="${ad.slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`
      : `<div class="ad-placeholder">Ad slot</div>`;
  return `<aside class="ad-slot ad-inline" aria-label="Advertisement"><span class="ad-label">Advertisement</span>${inner}</aside>`;
}

/** Reader donation page (Paystack, Stripe or similar). "" when donations are off. */
export function donateUrl() {
  const url = process.env.DONATE_URL?.trim() ?? "";
  return /^https:\/\/\S+$/.test(url) ? url : "";
}

/** "Paystack", "Stripe" or null, for telling readers where the button takes them. */
export function donateProvider(url: string) {
  const host = new URL(url).hostname;
  if (/(^|\.)paystack\.(com|shop)$/.test(host)) return "Paystack";
  if (/(^|\.)stripe\.com$/.test(host)) return "Stripe";
  if (/(^|\.)payfast\.co\.za$/.test(host)) return "PayFast";
  return null;
}
