import type { Metadata } from "next";
import { CONTACT, SITE_NAME, SOCIAL, TWITTER_HANDLE } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

/** Branded card used when a page or story has no picture of its own. */
export const SHARE_IMAGE = { url: "/share-image.png", width: 1200, height: 630, alt: SITE_NAME };

/** Wide wordmark Google shows for the publisher of a story. */
export const PUBLISHER_LOGO = { url: "/publisher-logo.png", width: 600, height: 60 };

/** A site path or full URL as a full URL. */
export function absoluteUrl(pathOrUrl: string) {
  return pathOrUrl.startsWith("/") ? siteUrl(pathOrUrl) : pathOrUrl;
}

/** One name for the newsroom in structured data, so every story's publisher points at the same organisation. */
export const orgId = () => siteUrl("/#organization");

/** The newsroom as Google knows it, for the publisher field of structured data. */
export function publisherLd() {
  return {
    "@type": "NewsMediaOrganization",
    "@id": orgId(),
    name: SITE_NAME,
    url: siteUrl("/"),
    logo: { "@type": "ImageObject", url: siteUrl(PUBLISHER_LOGO.url), width: PUBLISHER_LOGO.width, height: PUBLISHER_LOGO.height },
  };
}

/**
 * The full description of the newsroom for the homepage: its policies, contacts and social accounts.
 * Search engines and AI answer engines read these to judge who stands behind the reporting.
 */
export function organizationLd() {
  const contact = (contactType: string, email: string) => ({ "@type": "ContactPoint", contactType, email });
  return {
    ...publisherLd(),
    alternateName: "Report Focus",
    foundingDate: CONTACT.founded,
    email: CONTACT.editor,
    publishingPrinciples: siteUrl("/standards"),
    ethicsPolicy: siteUrl("/standards"),
    correctionsPolicy: siteUrl("/corrections"),
    masthead: siteUrl("/about"),
    actionableFeedbackPolicy: siteUrl("/contact"),
    contactPoint: [
      contact("newsroom", CONTACT.editor),
      contact("news tips", CONTACT.tips),
      contact("corrections", CONTACT.corrections),
      contact("advertising", CONTACT.advertising),
    ],
    sameAs: SOCIAL.map((s) => s.url),
  };
}

/** Bylines that name a desk rather than a person. In structured data they are the newsroom itself. */
const DESK_BYLINES = new Set(["news reporter", "staff reporter", "staff writer", "news desk", "report focus news", "report focus"]);

/** News agencies whose copy runs under their own byline, with their home pages. */
const WIRES: Record<string, { name: string; url: string }> = {
  reuters: { name: "Reuters", url: "https://www.reuters.com" },
  ap: { name: "The Associated Press", url: "https://apnews.com" },
  "associated press": { name: "The Associated Press", url: "https://apnews.com" },
  afp: { name: "AFP", url: "https://www.afp.com" },
  // An old WordPress account spelled AFP this way.
  apf: { name: "AFP", url: "https://www.afp.com" },
};

/** True when a byline is a desk or a news agency rather than a named person. */
export function isDeskByline(name: string) {
  const key = name.trim().toLowerCase();
  return DESK_BYLINES.has(key) || key in WIRES;
}

/**
 * True for a news agency byline. Agency stories run word for word without a syndication licence, so they are kept
 * out of search results and sitemaps: the agency's own copy is the original, and ours would only compete with it.
 */
export function isWireByline(name: string) {
  return name.trim().toLowerCase() in WIRES;
}

/**
 * A story's author for structured data. A person stays a Person; a desk byline such as "Staff Reporter"
 * becomes the newsroom, and a wire byline the agency, so search engines don't take them for real people.
 */
export function authorLd(author: { name: string; slug: string }) {
  const key = author.name.trim().toLowerCase();
  if (DESK_BYLINES.has(key)) return { "@type": "Organization", "@id": orgId(), name: SITE_NAME, url: siteUrl("/") };
  const wire = WIRES[key];
  if (wire) return { "@type": "Organization", name: wire.name, url: wire.url };
  const url = siteUrl(`/author/${author.slug}`);
  return { "@type": "Person", "@id": `${url}#person`, name: author.name, url };
}

/**
 * Text for a meta description: at most 155 characters, which is about what Google shows.
 * Ends on a whole sentence when one fits, otherwise on a whole word.
 */
export function metaDescription(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = cut.match(/^.*[.!?](?=\s)/)?.[0];
  if (sentence && sentence.length >= max * 0.5) return sentence;
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:–—-]+$/, "")}…`;
}

/**
 * A section or topic page as a collection of stories, with the breadcrumb that leads to it.
 * Gives search engines the page's name and its newest stories in order.
 */
export function collectionLd({ name, url, description, stories }: { name: string; url: string; description?: string; stories: { title: string; slug: string; category: { slug: string } | null }[] }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        name,
        url,
        description,
        isPartOf: { "@id": siteUrl("/#website") },
        publisher: { "@id": orgId() },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: stories.slice(0, 10).map((s, i) => ({ "@type": "ListItem", position: i + 1, url: siteUrl(`/${s.category?.slug ?? "news"}/${s.slug}`), name: s.title })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: siteUrl("/") },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">, safe to put inside HTML. */
export function ldJson(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Lets feed readers find the RSS feed from any page. */
export const RSS_ALTERNATE = { "application/rss+xml": [{ url: "/feed.xml", title: SITE_NAME }] };

/** Large pictures in Google Discover and Top Stories, and full-length snippets. */
export const ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  "max-image-preview": "large",
  "max-snippet": -1,
  "max-video-preview": -1,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

type PageMeta = {
  title: string;
  /** Use the title as it is, without " | Report Focus News" after it. */
  absoluteTitle?: boolean;
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
export function pageMeta({ title, absoluteTitle, description, path, image, noindex, openGraph }: PageMeta): Metadata {
  // WhatsApp, Facebook and X can't show SVG pictures, so those fall back to the branded card too.
  const images = image?.url && !/\.svg($|\?)/i.test(image.url) ? [{ url: image.url, alt: image.alt ?? title }] : [SHARE_IMAGE];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    // A page's alternates replace the site's, so the RSS feed link is repeated here.
    alternates: { canonical: path, types: RSS_ALTERNATE },
    robots: noindex ? { index: false, follow: true } : ROBOTS,
    openGraph: { siteName: SITE_NAME, locale: "en_ZA", type: "website", title, description, url: path, images, ...openGraph },
    twitter: { card: "summary_large_image", site: TWITTER_HANDLE, title, description, images },
  };
}

/** Path with ?page=N added after the first page, so each page of a list is its own canonical address. */
export function pagedPath(path: string, page: number) {
  return page > 1 ? `${path}?page=${page}` : path;
}
