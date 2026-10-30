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
    body: `Report Focus News is an independent news site covering South Africa, Zimbabwe and the rest of Africa, along with the biggest stories from around the world.

We were founded in [year] by [founder names]. Our newsroom is based in [city] and works with reporters and contributors across [countries or regions].

## What we cover

Politics, crime, business, health, climate and sport, with a focus on what the news means for the people living through it.

## How we work

Every story is read by an editor before it is published. We say where our information comes from, we give people the chance to respond before we publish claims about them, and we correct our mistakes in the open. Read our [editorial standards](/standards) and [corrections policy](/corrections).

## Who owns us

Report Focus News is owned by [company or owner name]. [Say how the newsroom is funded, for example advertising and reader support.] No advertiser or funder has a say in what we report.

## The team

- [Name], Editor
- [Name], News editor
- [Name], Reporter

_Replace the text in square brackets before launch. This page is edited in src/lib/site.ts._`,
  },
  contact: {
    title: "Contact",
    description: "How to reach the Report Focus News newsroom.",
    body: `## Newsroom

For news, story ideas and press releases, email [news@reportfocusnews.com].

## Tips

If you have information you think we should look into, see [Send a tip](/tips), or email [tips@reportfocusnews.com]. Tell us if you need to stay anonymous.

## Corrections

If you think we got something wrong, email [corrections@reportfocusnews.com] with a link to the story and what needs fixing. Read how we handle it on our [corrections page](/corrections).

## Advertising

For advertising and partnerships, email [ads@reportfocusnews.com].

## Post and phone

[Company name]  
[Street address]  
[City, postal code]  
[Country]

Phone: [+00 00 000 0000]

_Replace the text in square brackets before launch. This page is edited in src/lib/site.ts._`,
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
    body: `We work hard to get things right. When we get something wrong, we fix it quickly and say so.

## How we correct a story

- **Errors of fact**, such as a wrong name, number, date or quote, are fixed in the story. We add a note at the bottom saying what was wrong and when it was corrected.
- **Serious errors**, where the mistake changed the meaning of the story, get a note at the top of the story as well.
- **Small fixes**, such as spelling or grammar, are made without a note.
- We do not quietly delete stories. If a story cannot stand, we say why.

## Report an error

Email [corrections@reportfocusnews.com] with a link to the story and what you think is wrong. An editor reads every message and we aim to reply within [two working days].

## Recent corrections

- [Date]: [Story headline, linked]. [What was wrong and what we changed.]

_Replace the text in square brackets before launch. This page is edited in src/lib/site.ts._`,
  },
  podcasts: {
    title: "Podcasts",
    description: "Listen to Report Focus News.",
    body: "Our podcasts are on the way.\n\n_Add podcast links here before launch._",
  },
  privacy: {
    title: "Privacy policy",
    description: "How Report Focus News collects and uses information.",
    body: `_Last updated: [date]_

This policy explains what information Report Focus News collects when you use this website, why we collect it and what we do with it. Report Focus News is run by [company name], [address], which is responsible for your information.

## Reading the site

You can read Report Focus News without an account. Our own pages do not set tracking cookies. Our advertising partner does, as explained under Advertising below.

We count visits with [Plausible / Umami], a privacy-friendly stats service. It records which pages are read, which site sent you here, and your browser, device type and country. It does not use cookies, does not store your IP address and cannot identify you. We use these numbers only to understand what readers find useful.

## Newsletters and alerts

If you sign up for a newsletter or breaking-news alerts, we keep your email address and what you chose. We use it only to send those emails. Every email has a link to unsubscribe, and you can ask us to delete your address at any time.

## Contacting us

If you email us, send a tip or report an error, we keep your message and contact details so we can reply and follow up. We will not publish your name or details without your permission.

## Advertising

Report Focus News is paid for partly by advertising. Ads on this site are served by Google AdSense. Google and its partners may use cookies and similar technology to show ads, to limit how often you see the same ad, to measure how ads perform and, if you agree, to show ads based on your interests and the sites you have visited.

You can turn off personalised ads at [Google's ad settings](https://adssettings.google.com), and read how Google uses information from sites that use its services at [policies.google.com/technologies/partner-sites](https://policies.google.com/technologies/partner-sites). [If you show a cookie consent banner, say here how readers can change their choice.]

## Newsroom staff

Staff who sign in to the newsroom get one cookie that keeps them signed in. It is removed when they sign out.

## Sharing your information

We do not sell your information. We share it only with services that help us run the site, such as our hosting provider, our email provider, our visitor stats service and Google for advertising, and only as far as they need it. [List them here.]

## Your rights

You can ask to see, correct or delete the information we hold about you. Email [privacy@reportfocusnews.com]. [Add the rights that apply under your local law, for example POPIA in South Africa or GDPR in Europe, and how to complain to the regulator.]

## Changes to this policy

If we change this policy, we will update the date at the top of this page.

_This is a starting draft, not legal advice. Have it checked by a legal adviser and replace the text in square brackets before launch. This page is edited in src/lib/site.ts._`,
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

We count visits with [Plausible / Umami], which works without cookies and cannot identify you.

## Advertising cookies

Ads on this site come from Google AdSense. Google and its partners use cookies to show and measure ads, and, if you agree, to choose ads based on your interests. You can turn off personalised ads at [Google's ad settings](https://adssettings.google.com), or block or delete cookies in your browser settings.

[If you show a cookie consent banner, add a link here for readers to change their choice.]

Read our [privacy policy](/privacy) for more.

_Replace the text in square brackets before launch. This page is edited in src/lib/site.ts._`,
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
