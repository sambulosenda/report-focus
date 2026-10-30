import Script from "next/script";

/**
 * Privacy-friendly visitor stats for reader pages. Nothing loads until one of these is set on the server:
 * - Plausible: PLAUSIBLE_DOMAIN (and PLAUSIBLE_SCRIPT_URL when self-hosting)
 * - Umami: UMAMI_WEBSITE_ID (and UMAMI_SCRIPT_URL when self-hosting)
 * Both count visits without cookies or personal data. The newsroom is never tracked.
 */
export function Analytics() {
  const plausible = process.env.PLAUSIBLE_DOMAIN;
  const umami = process.env.UMAMI_WEBSITE_ID;
  return (
    <>
      {plausible && (
        <Script defer data-domain={plausible} src={process.env.PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js"} strategy="afterInteractive" />
      )}
      {umami && (
        <Script defer data-website-id={umami} src={process.env.UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js"} strategy="afterInteractive" />
      )}
    </>
  );
}
