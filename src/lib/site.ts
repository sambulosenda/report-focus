/** Site-wide names, links and static pages. Edit this file to change the footer or the standing pages. */

export const SITE_NAME = "Report Focus News";
export const TAGLINE = "Independent reporting. Fast when it breaks, thorough when it matters.";

/**
 * Social accounts shown in the footer and listed for Google. The defaults are the accounts the old
 * WordPress site linked on its About and Contact pages; a non-empty env variable overrides each one.
 * An account with no URL is left out.
 */
const social = (name: SocialName, env: string | undefined, fallback = "") => ({ name, url: env || fallback });
export type SocialName = "X" | "Facebook" | "Instagram" | "LinkedIn" | "YouTube" | "TikTok";
export const SOCIAL: { name: SocialName; url: string }[] = [
  social("X", process.env.NEXT_PUBLIC_SOCIAL_X, "https://x.com/reportfocus"),
  social("Facebook", process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, "https://www.facebook.com/reportfocusnews"),
  social("Instagram", process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, "https://www.instagram.com/reportfocusnews"),
  social("LinkedIn", process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, "https://www.linkedin.com/company/reportfocusnews"),
  social("YouTube", process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE),
  social("TikTok", process.env.NEXT_PUBLIC_SOCIAL_TIKTOK),
].filter((s) => s.url);

/**
 * Newsroom contact details used on the standing pages. Change an address here and every page that
 * shows it follows.
 */
export const CONTACT = {
  owner: "Report Focus News",
  founded: "2020",
  city: "Harare, Zimbabwe",
  editor: "editor@reportfocusnews.com",
  tips: "tips@reportfocusnews.com",
  corrections: "corrections@reportfocusnews.com",
  advertising: "advertising@reportfocusnews.com",
  privacy: "privacy@reportfocusnews.com",
};
const mail = (address: string) => `[${address}](mailto:${address})`;

export type InfoPage = { title: string; description: string; body: string };

/**
 * Standing pages linked from the footer, served at /<slug>.
 * Contact details come from CONTACT above.
 */
export const INFO_PAGES: Record<string, InfoPage> = {
  about: {
    title: "About us",
    description: "Who we are and how Report Focus News works.",
    body: `Report Focus News is an independent news site covering Zimbabwe, South Africa and the rest of Africa, along with the biggest stories from around the world.

We started in ${CONTACT.founded}. We are based in ${CONTACT.city} and work with reporters and contributors across Zimbabwe and South Africa.

## What we cover

Politics, crime, business, health, climate and sport, with a focus on what the news means for the people living through it.

## How we work

Every story is read by an editor before it is published. We say where our information comes from, we give people the chance to respond before we publish claims about them, and we correct our mistakes in the open. Read our [editorial standards](/standards) and [corrections policy](/corrections).

## Who owns us

Report Focus News is owned by ${CONTACT.owner}. We are paid for by advertising and by readers who [support our work](/support). No advertiser, donor or political group has a say in what we report.

## The team

- Brilliant Pongo, Editor-in-Chief
- Sambulo Senda, Managing Editor

To reach the newsroom, see our [contact page](/contact).`,
  },
  contact: {
    title: "Contact",
    description: "How to reach the Report Focus News newsroom.",
    body: `## Newsroom

For news, story ideas and press releases, email ${mail(CONTACT.editor)}. We read every message, but we cannot reply to them all or promise to publish a press release.

## Tips

If you have information you think we should look into, email ${mail(CONTACT.tips)} or read how to [send a tip](/tips). Tell us if you need to stay anonymous and we will protect your identity.

## Corrections

If you think we got something wrong, email ${mail(CONTACT.corrections)} with a link to the story and what needs fixing. Read how we handle it on our [corrections page](/corrections).

## Advertising

For advertising and partnerships, email ${mail(CONTACT.advertising)}.

## Privacy

For questions about your information, email ${mail(CONTACT.privacy)}.

## Social media

You can also find us on [X](https://x.com/reportfocus), [Facebook](https://www.facebook.com/reportfocusnews), [Instagram](https://www.instagram.com/reportfocusnews) and [LinkedIn](https://www.linkedin.com/company/reportfocusnews).

## Where we are

We are based in ${CONTACT.city}. We do not have a public office, so please get in touch by email.`,
  },
  careers: {
    title: "Careers",
    description: "Work at Report Focus News.",
    body: "We hire reporters, editors, producers and engineers who care about getting the story right.\n\n_List open roles here, or link to the jobs board, before launch._",
  },
  tips: {
    title: "Send a tip",
    description: "Share a story idea or information with our reporters.",
    body: `Know something we should look into? Our reporters read every tip.

Email ${mail(CONTACT.tips)}. Tell us what happened, when and where, and how we can reach you. Send documents or photos if you have them.

If you need to stay anonymous, say so and we will protect your identity. For extra safety, write from an email address that is not linked to your name or your work.`,
  },
  standards: {
    title: "Editorial standards",
    description: "The principles that guide Report Focus News journalism.",
    body: "## Accuracy\n\nWe verify what we publish. When we cannot confirm something, we say so.\n\n## Independence\n\nOur journalism is not influenced by advertisers, owners or political groups.\n\n## Corrections\n\nWhen we get something wrong, we fix it and say what changed.\n\n_Expand this page with the newsroom’s full standards before launch._",
  },
  corrections: {
    title: "Corrections",
    description: "How Report Focus News corrects its mistakes.",
    body: `We work hard to get things right. When we get something wrong, we fix it quickly and say so.

## How we correct a story

- **Errors of fact**, such as a wrong name, number, date or quote, are fixed in the story. We add a note at the bottom saying what was wrong and when it was corrected.
- **Serious errors**, where the mistake changed the meaning of the story, get a note at the top of the story as well.
- **Small fixes**, such as spelling or grammar, are made without a note.
- **Updates**, when a story changes because there is new information rather than a mistake, are marked as updates with the time.
- We do not quietly delete stories. If a story cannot stand, we say why.

## Report an error

Email ${mail(CONTACT.corrections)} with a link to the story and what you think is wrong. An editor reads every message and we aim to reply within two working days.

If you are named in a story and want to respond, email the same address. We will consider adding your response to the story.

## Complaints

If you are not happy with how we handled your correction, write to the Editor-in-Chief at ${mail(CONTACT.editor)}.`,
  },
  podcasts: {
    title: "Podcasts",
    description: "Listen to Report Focus News.",
    body: "Our podcasts are on the way.\n\n_Add podcast links here before launch._",
  },
  privacy: {
    title: "Privacy policy",
    description: "How Report Focus News collects and uses information.",
    body: `_Last updated: 30 October 2026_

This policy explains what information Report Focus News collects when you use this website, why we collect it and what we do with it. The site is run by ${CONTACT.owner}, ${CONTACT.city}, which is responsible for your information.

## Reading the site

You can read Report Focus News without an account. Our own pages do not set tracking cookies. Our advertising partner does, as explained under Advertising below.

We may count visits with a privacy-friendly stats service such as Plausible or Umami. It records which pages are read, which site sent you here, and your browser, device type and country. It does not use cookies, does not store your IP address and cannot identify you. We use these numbers only to understand what readers find useful.

Our servers keep short-lived technical logs, including IP addresses, to keep the site secure and fix problems. We also use an error-reporting service, Sentry, which receives technical details when a page breaks.

## Newsletters and alerts

If you sign up for a newsletter or breaking-news alerts, we keep your email address and what you chose, and we send you an email to confirm. We use your address only to send what you asked for. Our emails are sent through Resend. Every email has a link to unsubscribe, and you can ask us to delete your address at any time.

## Contacting us

If you email us, send a tip or report an error, we keep your message and contact details so we can reply and follow up. We will not publish your name or details without your permission, and we protect the identity of anyone who asks to stay anonymous.

## Supporting us

If you give money to Report Focus News, the payment is handled on our payment provider's own page, and that provider's privacy policy applies. We do not see or store your card details.

## Advertising

Report Focus News is paid for partly by advertising. Ads on this site are served by Google AdSense. Google and its partners may use cookies and similar technology to show ads, to limit how often you see the same ad, to measure how ads perform and, if you agree, to show ads based on your interests and the sites you have visited.

You can turn off personalised ads at [Google's ad settings](https://adssettings.google.com), and read how Google uses information from sites that use its services at [policies.google.com/technologies/partner-sites](https://policies.google.com/technologies/partner-sites). You can also block or delete cookies in your browser settings.

## Newsroom staff

Staff who sign in to the newsroom get one cookie that keeps them signed in. It is removed when they sign out.

## Sharing your information

We do not sell your information. We share it only with services that help us run the site, and only as far as they need it:

- Fly.io, which hosts the site
- Turso, which stores our database
- Cloudflare, which delivers pages and photos
- Resend, which sends our emails
- Sentry, which reports errors
- Google, for advertising

Some of these services store data outside Zimbabwe and South Africa, including in the European Union and the United States. We may also share information when the law requires it.

## How long we keep it

We keep newsletter addresses until you unsubscribe, messages to the newsroom for as long as we need them to follow up a story, and server logs for no more than 30 days.

## Your rights

You can ask to see, correct or delete the information we hold about you, or object to how we use it. Email ${mail(CONTACT.privacy)} and we will reply within 30 days.

If you are in Zimbabwe, you can complain to the Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ), the data protection authority under the Cyber and Data Protection Act. If you are in South Africa, you can complain to the [Information Regulator](https://inforegulator.org.za) under the Protection of Personal Information Act (POPIA). If you are in the UK or Europe, you have rights under the GDPR and can complain to your local data protection authority.

## Changes to this policy

If we change this policy, we will update the date at the top of this page.`,
  },
  terms: {
    title: "Terms of use",
    description: "The terms that apply when you use Report Focus News.",
    body: "_The terms of use have not been written yet. Publish the terms approved by your legal adviser here before launch._",
  },
  cookies: {
    title: "Cookie settings",
    description: "How Report Focus News uses cookies.",
    body: `## Cookies we set

One cookie keeps newsroom staff signed in. Readers get no cookies from Report Focus News itself.

## Visitor stats

We may count visits with a privacy-friendly stats service such as Plausible or Umami. It works without cookies and cannot identify you.

## Advertising cookies

Ads on this site come from Google AdSense. Google and its partners use cookies to show and measure ads, and, if you agree, to choose ads based on your interests. You can turn off personalised ads at [Google's ad settings](https://adssettings.google.com), or block or delete cookies in your browser settings.

Read our [privacy policy](/privacy) for more.`,
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
  "newsroom", "login", "search", "latest", "author", "tag", "media", "live", "video", "demo", "feed.xml", "sitemap.xml", "robots.txt", "api", "newsletters", "support", "ads.txt", "news-sitemap.xml",
  // Old WordPress addresses are looked up here.
  "wp-redirect",
  // Standing pages share the top-level URL space with sections.
  ...Object.keys(INFO_PAGES),
]);
