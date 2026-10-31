import { IMAGE_HOSTS } from "@/lib/images";

/** Landscape frame WhatsApp, Facebook and X expect for a link preview. */
export const SOCIAL_WIDTH = 1200;
export const SOCIAL_HEIGHT = 630;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

function mediaHost() {
  const raw = process.env.MEDIA_HOST || process.env.S3_PUBLIC_URL || "";
  if (!raw) return "";
  try {
    return raw.includes("://") ? new URL(raw).hostname : raw;
  } catch {
    return "";
  }
}

function allowedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const media = mediaHost();
  return IMAGE_HOSTS.includes(host) || (!!media && host === media.toLowerCase());
}

/**
 * A picture we are willing to crop for a share preview.
 * Only our own uploads: this URL is fetched by the server, so anything else is refused.
 */
export function socialImageSrc(src: string) {
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    const pathOnly = trimmed.split(/[?#]/, 1)[0] ?? "";
    if (!pathOnly || pathOnly.split("/").includes("..") || pathOnly.includes("\\")) return null;
    if (!IMAGE_EXT.test(pathOnly)) return null;
    return pathOnly;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (!allowedHost(url.hostname) || !IMAGE_EXT.test(url.pathname)) return null;
  return url.toString();
}

/** Address of the 1200×630 crop. `v` changes when the crop itself changes, so old previews expire. */
export function socialImagePath(src: string) {
  const safe = socialImageSrc(src);
  if (!safe) return null;
  return `/social-image?v=2&src=${encodeURIComponent(safe)}`;
}
