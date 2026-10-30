/** Hosts whose pictures Next.js may resize. Pictures from anywhere else are shown as they are. */
export const IMAGE_HOSTS = ["backend.reportfocusnews.com", "reportfocusnews.com", "www.reportfocusnews.com"];

/**
 * Whether a picture can go through the Next.js image resizer. Our own uploads and the old WordPress
 * host can; SVGs and pictures from other sites are passed through untouched so a stray URL never breaks a page.
 */
export function canOptimize(src: string) {
  if (/\.svg($|\?)/i.test(src)) return false;
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    return IMAGE_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
