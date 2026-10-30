/** Hosts whose pictures Next.js may resize. Pictures from anywhere else are shown as they are. */
export const IMAGE_HOSTS = ["backend.reportfocusnews.com", "reportfocusnews.com", "www.reportfocusnews.com"];

/** Host of the S3/R2 image bucket. next.config.ts reads it from S3_PUBLIC_URL at build time. */
const MEDIA_HOST = process.env.MEDIA_HOST;

/**
 * Whether a picture can go through the Next.js image resizer. Our own uploads and the old WordPress
 * host can; SVGs and pictures from other sites are passed through untouched so a stray URL never breaks a page.
 */
export function canOptimize(src: string) {
  if (/\.svg($|\?)/i.test(src)) return false;
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    const host = new URL(src).hostname;
    return IMAGE_HOSTS.includes(host) || host === MEDIA_HOST;
  } catch {
    return false;
  }
}
