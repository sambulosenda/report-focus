/** Site-wide names, links and static pages. Edit this file to change the footer or the standing pages. */

export const SITE_NAME = "Report Focus News";
/** Homepage title and description, which also stand in for any page without its own. */
export const HOME_TITLE = "Report Focus News | Zimbabwe, South Africa and Africa News";
export const HOME_DESCRIPTION =
  "Independent reporting and analysis on Zimbabwe, South Africa and the rest of Africa: politics, crime, business and more.";

/** The X account, shown on share cards. */
export const TWITTER_HANDLE = "@ReportFocus";
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
  social("LinkedIn", process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, "https://www.linkedin.com/company/report-focus"),
  social("YouTube", process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE),
  social("TikTok", process.env.NEXT_PUBLIC_SOCIAL_TIKTOK),
].filter((s) => s.url);

/**
 * Newsroom contact details used on the standing pages. Change an address here and every page that
 * shows it follows.
 */
export const CONTACT = {
  owner: "Sambulo Senda",
  editorInChief: "Brilliant Pongo",
  founded: "2017",
  city: "the United Kingdom",
  editor: "editor@reportfocusnews.com",
  tips: "tips@reportfocusnews.com",
  corrections: "corrections@reportfocusnews.com",
  advertising: "advertising@reportfocusnews.com",
  privacy: "privacy@reportfocusnews.com",
};
const mail = (address: string) => `[${address}](mailto:${address})`;

/** A standing page. Unfinished ones are kept out of search results and the footer with noindex. */
export type InfoPage = { title: string; description: string; body: string; noindex?: boolean };

/**
 * Standing pages linked from the footer, served at /<slug>.
 * Contact details come from CONTACT above.
 */
export const INFO_PAGES: Record<string, InfoPage> = {
  about: {
    title: "About us",
    description: "Who we are and how Report Focus News works.",
    body: `Report Focus News is an independent news site covering Zimbabwe, South Africa and the rest of Africa, along with the biggest stories from around the world.

We started in ${CONTACT.founded}. We are run from ${CONTACT.city} and work with reporters and contributors across Zimbabwe and South Africa.

## What we cover

Politics, crime, business, health, climate and sport, with a focus on what the news means for the people living through it.

## How we work

Every story is read by an editor before it is published. We say where our information comes from, we give people the chance to respond before we publish claims about them, and we correct our mistakes in the open. Read our [editorial standards](/standards) and [corrections policy](/corrections).

## Who owns us

Report Focus News is owned by ${CONTACT.owner}. We are paid for by advertising and by readers who [support our work](/support). No advertiser, donor or political group has a say in what we report.

## The team

- ${CONTACT.editorInChief}, Editor-in-Chief
- ${CONTACT.owner}, Managing Editor

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

You can also find us on [X](https://x.com/reportfocus), [Facebook](https://www.facebook.com/reportfocusnews), [Instagram](https://www.instagram.com/reportfocusnews) and [LinkedIn](https://www.linkedin.com/company/report-focus).

## Where we are

We are run from ${CONTACT.city}. We do not have a public office, so please get in touch by email.`,
  },
  careers: {
    title: "Careers",
    description: "Work at Report Focus News.",
    body: `We have no open roles right now. If you would like to write for us, email ${mail(CONTACT.editor)} with a few links to your work.`,
    noindex: true,
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
    description: "The principles that guide Report Focus News journalism: accuracy, fairness, independence and how we use sources.",
    body: `_Last updated: 30 October 2026_

These are the rules our reporters and editors work to. If you think we have broken them, email ${mail(CONTACT.editor)}.

## Accuracy

We check what we publish before we publish it. Facts, names, numbers, dates and quotes are confirmed with the people involved, official records or more than one reliable source. When we cannot confirm something, we say so, or we wait.

We say how we know what we report: who told us, which document it comes from, or what we saw ourselves.

## Sources

We name our sources whenever we can. We give a source anonymity only when they could lose their job, their safety or their freedom by being named, and only when the information matters to the public and cannot be had another way. An editor must know who an anonymous source is and agree to using them. We tell readers why the source was not named.

We protect the identity of anyone we have promised anonymity to.

We do not pay sources for information.

## Fairness and the right to reply

Before we publish a serious claim about a person or organisation, we contact them and give them a fair chance to respond. We include their response, or say that they did not reply.

We report what people say accurately and in context. We do not change quotes, except to correct small slips of grammar that do not change the meaning.

## Independence

Our reporting is decided by our editors alone. No advertiser, donor, government, political party or owner has a say in what we cover or how.

Reporters and editors do not cover people or organisations they have a personal, family or financial link to. They tell an editor about anything that could look like a conflict of interest.

We do not accept gifts, payments or free travel in return for coverage.

## News, analysis and opinion

We label stories clearly. News stories report what happened. Analysis explains what it means and is based on evidence. Opinion pieces give the writer's own view and are marked as opinion. The views in opinion pieces are the writer's, not those of Report Focus News.

## Bylines and news agencies

Stories carry the name of the reporter who wrote them. "Staff Reporter" is used when several reporters worked on a story, or when naming the reporter would put them at risk.

When we use reporting from news agencies or other outlets, we credit them in the story.

## Pictures and video

We do not alter news pictures or video in ways that mislead. Pictures used to illustrate a story, rather than show the event itself, are labelled as such. We credit the photographer or the source.

## Artificial intelligence

We do not publish stories, pictures or video made by artificial intelligence as if they were our own reporting. Any use of AI tools in a story, such as help translating a document, is checked by a journalist and an editor.

## Privacy, harm and the vulnerable

We respect people's privacy unless there is a clear public interest in reporting it. We take extra care with children, victims of crime, people who are grieving, and survivors of sexual violence, whom we do not name without their consent.

We do not publish graphic images of death or injury unless they are needed to tell the story, and we warn readers when we do.

## Advertising and sponsored content

Advertising is kept apart from our journalism. Anything paid for by an advertiser is clearly labelled as sponsored or advertising.

## Corrections

When we get something wrong, we fix it and say what changed. Read our [corrections policy](/corrections).`,
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
    body: "We do not have any podcasts yet.",
    noindex: true,
  },
  privacy: {
    title: "Privacy policy",
    description: "How Report Focus News collects and uses information.",
    body: `_Last updated: 30 October 2026_

This policy explains what information Report Focus News collects when you use this website, why we collect it and what we do with it. The site is owned and run by ${CONTACT.owner}, in ${CONTACT.city}, who is responsible for your information.

## Reading the site

You can read Report Focus News without an account. Our own pages do not set tracking cookies. Our advertising partner does, as explained under Advertising below.

We count visits with Umami, a privacy-friendly stats service. It records which pages are read, which site sent you here, and your browser, device type and country. It does not use cookies, does not store your IP address and cannot identify you. We use these numbers only to understand what readers find useful.

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
- Umami, which counts visits
- Google, for advertising

Some of these services store data outside Zimbabwe and South Africa, including in the European Union and the United States. We may also share information when the law requires it.

## How long we keep it

We keep newsletter addresses until you unsubscribe, messages to the newsroom for as long as we need them to follow up a story, and server logs for no more than 30 days.

## Your rights

You can ask to see, correct or delete the information we hold about you, or object to how we use it. Email ${mail(CONTACT.privacy)} and we will reply within 30 days.

If you are in Zimbabwe, you can complain to the Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ), the data protection authority under the Cyber and Data Protection Act. If you are in South Africa, you can complain to the [Information Regulator](https://inforegulator.org.za) under the Protection of Personal Information Act (POPIA). If you are in the UK, you have rights under the UK GDPR and can complain to the [Information Commissioner's Office](https://ico.org.uk). If you are in Europe, you can complain to your local data protection authority.

## Changes to this policy

If we change this policy, we will update the date at the top of this page.`,
  },
  terms: {
    title: "Terms of use",
    description: "The terms that apply when you read, share or use Report Focus News.",
    body: `_Last updated: 30 October 2026_

These terms apply when you use reportfocusnews.com. By using the site, you agree to them. If you do not agree, please do not use the site.

Report Focus News is owned by ${CONTACT.owner} and run from ${CONTACT.city}. In these terms, "we" and "us" mean Report Focus News.

## Using the site

You can read Report Focus News for free. You may use the site for your own personal, non-commercial use.

You must not:

- copy, republish, sell or distribute our stories, pictures or video without our written permission, except as allowed below
- collect our content with automated tools, or use it to train artificial intelligence systems, without our written permission
- try to break into, overload or interfere with the site or the systems behind it
- use the site for anything unlawful

## Sharing our stories

You are welcome to share links to our stories, and to quote a short extract with a credit to Report Focus News and a link to the original story.

To republish a whole story, picture or video, email ${mail(CONTACT.editor)} for permission.

## Who owns the content

The stories, pictures, video, design and logo on this site belong to Report Focus News or to the people and organisations who licensed them to us, such as news agencies and photographers. Using the site does not give you any rights to them.

## Our reporting

We work hard to make our reporting accurate, and we correct mistakes as set out in our [corrections policy](/corrections). But news changes quickly, and stories are written at a point in time. Nothing on the site is professional advice, such as legal, medical or financial advice. Do not rely on it as a substitute for that advice.

## What you send us

When you send us a tip, picture, video or other material, you confirm that you have the right to send it. You allow us to use it in our reporting, with a credit to you unless you ask to stay anonymous. You still own what you sent. Read how we handle your information in our [privacy policy](/privacy).

## Newsletters and alerts

If you sign up for a newsletter or alerts, you can unsubscribe at any time using the link in every email.

## Advertising and other websites

The site carries advertising, and some stories link to other websites. We are not responsible for advertisers' products or for the content of other websites. A link to another site does not mean we endorse it.

## Availability

We try to keep the site running at all times, but we cannot promise that it will always be available or free of errors. We may change or remove any part of the site.

## Our responsibility to you

We are not responsible for any loss that comes from using the site or relying on its content, as far as the law allows. Nothing in these terms limits any right you have that the law does not allow us to exclude.

## Changes to these terms

We may update these terms. The date at the top of this page shows when they last changed. If you keep using the site after a change, the new terms apply.

## Contact

For questions about these terms, email ${mail(CONTACT.editor)}.`,
  },
  cookies: {
    title: "Cookie settings",
    description: "How Report Focus News uses cookies.",
    body: `## Cookies we set

One cookie keeps newsroom staff signed in. Readers get no cookies from Report Focus News itself.

## Visitor stats

We count visits with Umami, a privacy-friendly stats service. It works without cookies and cannot identify you.

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
  // Video and Podcasts come back here once there is something to watch or hear.
  watch: [
    { label: "Report Focus Live", href: "/live" },
    { label: "Latest news", href: "/latest" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "Contact", href: "/contact" },
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
  "wp-redirect", "wp-gone", "llms.txt", "llms-full.txt",
  // Standing pages share the top-level URL space with sections.
  ...Object.keys(INFO_PAGES),
]);
