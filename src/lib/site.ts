/** Site-wide names, links and static pages. Edit this file to change the footer or the standing pages. */

export const SITE_NAME = "Report Focus News";
export const TAGLINE = "Independent reporting. Fast when it breaks, thorough when it matters.";

/**
 * Social accounts shown in the footer. Add each profile URL when the account exists;
 * icons without a URL are shown but not linked.
 */
export const SOCIAL: { name: "X" | "Facebook" | "Instagram" | "YouTube" | "TikTok"; url: string }[] = [
  { name: "X", url: process.env.NEXT_PUBLIC_SOCIAL_X ?? "" },
  { name: "Facebook", url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "" },
  { name: "Instagram", url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "" },
  { name: "YouTube", url: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "" },
  { name: "TikTok", url: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? "" },
];

export type InfoPage = { title: string; description: string; body: string };

/**
 * Standing pages linked from the footer, served at /<slug>.
 * The copy is a starting point written for launch prep; replace it with the newsroom's own wording.
 */
export const INFO_PAGES: Record<string, InfoPage> = {
  about: {
    title: "About us",
    description: "Who we are and how Report Focus News works.",
    body: "Report Focus News is an independent newsroom covering the US and the world, with a focus on politics, the economy, health, climate and sport.\n\nOur reporters and editors work to one standard: get it right, then get it fast. Every story is read by an editor before it is published.\n\n_This page is a placeholder. Replace it with the newsroom’s own story before launch._",
  },
  contact: {
    title: "Contact",
    description: "How to reach the Report Focus News newsroom.",
    body: "To reach the newsroom, send a tip, report an error or ask about advertising, use the contact details below.\n\n_Add the newsroom’s email addresses and phone numbers here before launch._",
  },
  careers: {
    title: "Careers",
    description: "Work at Report Focus News.",
    body: "We hire reporters, editors, producers and engineers who care about getting the story right.\n\n_List open roles here, or link to the jobs board, before launch._",
  },
  tips: {
    title: "Send a tip",
    description: "Share a story idea or information with our reporters.",
    body: "Know something we should look into? Our reporters read every tip.\n\nTell us what happened, when and where, and how we can reach you. If you need to stay anonymous, say so and we will protect your identity.\n\n_Add the secure tip line and email address here before launch._",
  },
  standards: {
    title: "Editorial standards",
    description: "The principles that guide Report Focus News journalism.",
    body: "## Accuracy\n\nWe verify what we publish. When we cannot confirm something, we say so.\n\n## Independence\n\nOur journalism is not influenced by advertisers, owners or political groups.\n\n## Corrections\n\nWhen we get something wrong, we fix it and say what changed.\n\n_Expand this page with the newsroom’s full standards before launch._",
  },
  corrections: {
    title: "Corrections",
    description: "How Report Focus News corrects its mistakes.",
    body: "When we make a mistake, we correct it promptly and add a note to the story explaining what changed.\n\nTo report an error, use the contact page and include a link to the story.\n\n_List recent corrections here before launch._",
  },
  newsletters: {
    title: "Newsletters",
    description: "Sign up for The Morning Focus and other newsletters.",
    body: "**The Morning Focus** brings you the five stories you need before 8 a.m., every weekday. Sign up with the form below.",
  },
  podcasts: {
    title: "Podcasts",
    description: "Listen to Report Focus News.",
    body: "Our podcasts are on the way.\n\n_Add podcast links here before launch._",
  },
  privacy: {
    title: "Privacy policy",
    description: "How Report Focus News collects and uses information.",
    body: "_The privacy policy has not been written yet. Publish the policy approved by your legal adviser here before launch._",
  },
  terms: {
    title: "Terms of use",
    description: "The terms that apply when you use Report Focus News.",
    body: "_The terms of use have not been written yet. Publish the terms approved by your legal adviser here before launch._",
  },
  cookies: {
    title: "Cookie settings",
    description: "How Report Focus News uses cookies.",
    body: "Report Focus News uses one cookie, which keeps newsroom staff signed in. Readers are not tracked.\n\n_Update this page if you add analytics or advertising._",
  },
  accessibility: {
    title: "Accessibility",
    description: "Our commitment to an accessible website.",
    body: "We want everyone to be able to read Report Focus News. The site is built to work with screen readers, keyboard navigation and browser zoom.\n\nIf something does not work for you, please tell us through the contact page.",
  },
};

export const FOOTER_LINKS = {
  watch: [
    { label: "Report Focus Live", href: "/live" },
    { label: "Video", href: "/video" },
    { label: "The Evening Focus", href: "/video" },
    { label: "Podcasts", href: "/podcasts" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Send a tip", href: "/tips" },
  ],
  help: [
    { label: "Editorial standards", href: "/standards" },
    { label: "Corrections", href: "/corrections" },
    { label: "Newsletters", href: "/newsletters" },
    { label: "Newsroom sign in", href: "/login" },
  ],
  legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
    { label: "Cookie settings", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
  ],
};

/** Top-level URLs that belong to pages, so no section may use them as its slug. */
export const RESERVED_SLUGS = new Set([
  "newsroom", "login", "search", "latest", "author", "tag", "media", "live", "video", "demo", "feed.xml", "sitemap.xml", "robots.txt", "api",
  // Old WordPress addresses are looked up here.
  "wp-redirect",
  // Standing pages share the top-level URL space with sections.
  ...Object.keys(INFO_PAGES),
]);
