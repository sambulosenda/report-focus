import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

/** Branded card used when a page or story has no picture of its own. */
export const SHARE_IMAGE = { url: "/share-image.png", width: 1200, height: 630, alt: SITE_NAME };

/** Wide wordmark Google shows for the publisher of a story. */
export const PUBLISHER_LOGO = { url: "/publisher-logo.png", width: 600, height: 60 };

/** A site path or full URL as a full URL. */
export function absoluteUrl(pathOrUrl: string) {
  return pathOrUrl.startsWith("/") ? siteUrl(pathOrUrl) : pathOrUrl;
}

/** The newsroom as Google knows it, for the publisher field of structured data. */
export function publisherLd() {
  return {
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: { "@type": "ImageObject", url: siteUrl(PUBLISHER_LOGO.url), width: PUBLISHER_LOGO.width, height: PUBLISHER_LOGO.height },
  };
}

/** JSON for a <script type="application/ld+json">, safe to put inside HTML. */
export function ldJson(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

type PageMeta = {
  title: string;
  description?: string;
  /** Site path of the page's one true address, e.g. "/politics". */
  path: string;
  image?: { url: string; alt?: string | null } | null;
  noindex?: boolean;
  openGraph?: NonNullable<Metadata["openGraph"]>;
};

/**
 * Title, description, canonical link and share previews (WhatsApp, Facebook, X) for a page.
 * A page's own openGraph replaces the site default, so this rebuilds every field each time.
 */
export function pageMeta({ title, description, path, image, noindex, openGraph }: PageMeta): Metadata {
  // WhatsApp, Facebook and X can't show SVG pictures, so those fall back to the branded card too.
  const images = image?.url && !/\.svg($|\?)/i.test(image.url) ? [{ url: image.url, alt: image.alt ?? title }] : [SHARE_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: { siteName: SITE_NAME, locale: "en_ZA", type: "website", title, description, url: path, images, ...openGraph },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** Path with ?page=N added after the first page, so each page of a list is its own canonical address. */
export function pagedPath(path: string, page: number) {
  return page > 1 ? `${path}?page=${page}` : path;
}
