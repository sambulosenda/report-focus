/**
 * Fills a fresh database with staff accounts, sections and sample stories so the site has something to show.
 * Sample stories are fictional placeholders. Delete them before launch.
 *
 *   npm run db:seed            # only seeds an empty database
 *   npm run db:seed -- --force # wipes stories, sections and staff first
 */
import { mkdirSync } from "node:fs";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

const force = process.argv.includes("--force");
const PASSWORD = process.env.SEED_PASSWORD ?? "newsroom-demo-2026";

const SECTIONS = [
  { name: "US", slug: "us", color: "#1d4ed8", description: "News from across the country." },
  { name: "World", slug: "world", color: "#0f766e", description: "International news, conflict and diplomacy." },
  { name: "Politics", slug: "politics", color: "#b91c1c", description: "Government, elections and policy." },
  { name: "Business", slug: "business", color: "#a16207", description: "Markets, the economy and your money." },
  { name: "Technology", slug: "technology", color: "#7c3aed", description: "The tech shaping how we live and work." },
  { name: "Health", slug: "health", color: "#059669", description: "Medicine, wellbeing and public health." },
  { name: "Climate", slug: "climate", color: "#15803d", description: "Weather, climate and the environment." },
  { name: "Sports", slug: "sports", color: "#c2410c", description: "Scores, stories and the people behind the games." },
  { name: "Entertainment", slug: "entertainment", color: "#db2777", description: "Film, TV, music and culture." },
];

const STAFF = [
  { name: "Alex Morgan", email: "admin@reportfocus.news", role: "admin", title: "Managing Editor", bio: "Alex runs the Report Focus newsroom." },
  { name: "Priya Nair", email: "editor@reportfocus.news", role: "editor", title: "News Editor", bio: "Priya edits the daily news file and leads breaking coverage." },
  { name: "Daniel Okafor", email: "daniel@reportfocus.news", role: "journalist", title: "Political Correspondent", bio: "Daniel covers government and elections." },
  { name: "Grace Liu", email: "grace@reportfocus.news", role: "journalist", title: "Business Reporter", bio: "Grace reports on markets, work and the economy." },
  { name: "Marcus Bell", email: "marcus@reportfocus.news", role: "journalist", title: "Science and Health Reporter", bio: "Marcus covers health, science and the climate." },
] as const;

type Sample = { title: string; section: string; author: number; summary: string; body: string[]; tags: string; breaking?: boolean; featured?: boolean; hoursAgo: number };

const SAMPLES: Sample[] = [
  {
    title: "Storm system brings record rainfall to the Gulf Coast as crews prepare for flooding",
    section: "climate", author: 4, breaking: true, featured: true, hoursAgo: 1, tags: "weather, flooding, sample",
    summary: "Forecasters say parts of the region could see a month’s worth of rain in two days, and emergency managers are opening shelters.",
    body: [
      "A slow-moving storm system parked over the Gulf Coast on Wednesday, dropping more than eight inches of rain in some areas and prompting flash flood warnings for several coastal counties.",
      "Emergency managers opened shelters overnight and urged residents in low-lying neighborhoods to move to higher ground before the heaviest bands arrive this evening.",
      "## What forecasters expect",
      "The weather service said the system is expected to stall for at least another 24 hours. Rivers in the area are already running high after a wet autumn.",
      "> “The ground simply can’t take any more water,” one regional forecaster said. “That’s what makes this dangerous.”",
      "Officials are asking drivers to avoid flooded roads. Just six inches of moving water can knock a person off their feet, and a foot of water can float most cars.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Lawmakers reach late-night deal to keep the government funded through spring",
    section: "politics", author: 2, featured: true, hoursAgo: 3, tags: "congress, budget, sample",
    summary: "The agreement avoids a shutdown but leaves the toughest spending fights for next year.",
    body: [
      "Negotiators from both parties announced a short-term funding agreement shortly before midnight, ending a week of uncertainty over whether federal agencies would close.",
      "The measure keeps spending at current levels and includes emergency money for disaster recovery. Votes in both chambers are expected later this week.",
      "## What’s in the deal",
      "- Funding for federal agencies through the end of March\n- Disaster relief for communities hit by this year’s storms\n- An extension of several expiring health programs",
      "Leaders on both sides described the deal as imperfect but necessary. A longer-term budget will still need to be negotiated in the new year.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Stocks rally as new data shows inflation cooling for a third straight month",
    section: "business", author: 3, featured: true, hoursAgo: 5, tags: "markets, inflation, sample",
    summary: "Investors are betting that interest rates could start to come down sooner than expected.",
    body: [
      "Major stock indexes climbed on Tuesday after a closely watched report showed consumer prices rose more slowly than economists had forecast.",
      "Prices for groceries and used cars were flat for the month, while housing costs continued to rise at a slower pace than earlier in the year.",
      "## What it means for your wallet",
      "Economists say cooling inflation is good news for household budgets, though prices remain well above where they were a few years ago.",
      "Mortgage rates have already begun to edge lower in anticipation of rate cuts, which could bring some buyers back into the housing market.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Hospitals report early start to flu season, urge people to get vaccinated now",
    section: "health", author: 4, hoursAgo: 6, tags: "flu, vaccines, sample",
    summary: "Doctors say emergency rooms are already busier than usual for this time of year.",
    body: [
      "Health officials say flu cases have started rising several weeks earlier than usual, and hospitals in several states are reporting busier emergency departments.",
      "Doctors recommend that everyone six months and older get a flu shot, ideally before the end of October. It takes about two weeks for the vaccine to provide protection.",
      "## Who is most at risk",
      "Young children, adults over 65, pregnant people and anyone with a chronic health condition are more likely to develop serious complications.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "City council approves plan to turn empty office towers into apartments",
    section: "us", author: 2, hoursAgo: 8, tags: "housing, cities, sample",
    summary: "Supporters say the conversions could add thousands of homes downtown within five years.",
    body: [
      "The city council voted 9 to 2 on Monday to approve zoning changes and tax incentives that would make it easier for developers to convert vacant office buildings into housing.",
      "Downtown office occupancy has not recovered since remote work became common, leaving entire floors of some towers empty.",
      "Critics worry the incentives are too generous and that the new apartments won’t be affordable for most residents. The plan requires that 15 percent of units be set aside for lower-income households.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Leaders gather for summit on shipping lanes and food security",
    section: "world", author: 1, featured: true, hoursAgo: 4, tags: "diplomacy, trade, sample",
    summary: "Delegations from more than 30 countries are meeting to discuss keeping grain and fuel moving through key routes.",
    body: [
      "Diplomats and trade ministers from more than 30 countries opened a two-day summit focused on protecting shipping lanes that carry much of the world’s grain and fuel.",
      "Disruptions over the past year have pushed up freight costs and contributed to higher food prices in import-dependent countries.",
      "## The goals",
      "Organizers hope to agree on a shared framework for escorting commercial vessels and a fund to help countries cope with sudden price spikes.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "New smartphone rules would let you repair your own device",
    section: "technology", author: 3, hoursAgo: 10, tags: "right to repair, smartphones, sample",
    summary: "Manufacturers would have to sell parts and publish repair manuals for at least seven years.",
    body: [
      "Regulators unveiled draft rules on Thursday that would require phone makers to make spare parts, tools and repair guides available to consumers and independent shops.",
      "Repair advocates say the change could extend the life of devices and cut electronic waste. Industry groups say they support repairability but worry about security and safety.",
      "The public has 60 days to comment on the proposal before a final version is released.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Underdogs stun defending champions in overtime thriller",
    section: "sports", author: 1, hoursAgo: 12, tags: "playoffs, sample",
    summary: "A last-second goal sends the lowest seed into the semifinals for the first time in its history.",
    body: [
      "Nobody gave them much of a chance. On Sunday night, the lowest-seeded team in the bracket knocked out the defending champions with a goal in the final minute of overtime.",
      "The winning shot came on a counterattack after a blocked chance at the other end, setting off wild celebrations among the traveling fans.",
      "> “We’ve been told all season we didn’t belong here,” the team’s captain said afterward. “Tonight we proved we do.”",
      "They will face the second seed in the semifinals next weekend.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Indie film about a small-town radio station becomes surprise box office hit",
    section: "entertainment", author: 3, hoursAgo: 14, tags: "film, sample",
    summary: "Made for under $2 million, the movie has now earned more than ten times its budget.",
    body: [
      "A low-budget drama about the last independent radio station in a fading mill town has become the unlikely hit of the autumn movie season.",
      "The film expanded from a handful of theaters to more than 2,000 screens after strong word of mouth and glowing reviews.",
      "Its director, a first-time filmmaker, said the story was inspired by the station she listened to growing up.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Voters to decide on statewide plan to expand public transit",
    section: "politics", author: 2, hoursAgo: 20, tags: "elections, transit, sample",
    summary: "The ballot measure would raise sales taxes by half a cent to fund new rail and bus lines.",
    body: [
      "Voters will decide next month whether to approve a half-cent sales tax increase to pay for a major expansion of buses and commuter rail.",
      "Supporters say the plan would cut traffic and give more people access to jobs. Opponents argue it places an unfair burden on residents who don’t live near the new routes.",
      "Early polling shows a close race, with a large share of voters still undecided.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Small businesses say rising insurance costs are their biggest worry",
    section: "business", author: 3, hoursAgo: 26, tags: "small business, insurance, sample",
    summary: "A new survey finds premiums for property and liability coverage jumped by double digits this year.",
    body: [
      "More than half of small business owners surveyed said insurance is now a bigger concern than rent or wages, according to a report released Wednesday.",
      "Owners in areas exposed to wildfires, storms and flooding reported the steepest increases, with some saying their coverage was dropped altogether.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Researchers say a daily walk after dinner may help control blood sugar",
    section: "health", author: 4, hoursAgo: 30, tags: "exercise, diabetes, sample",
    summary: "Even 10 to 15 minutes of light movement after a meal made a measurable difference in a new study.",
    body: [
      "A short walk after eating can help keep blood sugar levels steadier, according to new research involving more than 400 adults.",
      "Participants who walked for 10 to 15 minutes after dinner saw smaller spikes in blood sugar than those who sat or lay down.",
      "Doctors say the findings add to evidence that small, regular amounts of movement matter, even for people who don’t exercise much otherwise.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Wildfire smoke drifts hundreds of miles, triggering air quality alerts",
    section: "climate", author: 4, hoursAgo: 34, tags: "wildfire, air quality, sample",
    summary: "Health officials advise limiting time outdoors, especially for children and older adults.",
    body: [
      "Smoke from wildfires burning in the west has drifted across several states, turning skies hazy and pushing air quality into unhealthy ranges.",
      "Officials recommend keeping windows closed, running air purifiers if you have them, and avoiding strenuous activity outdoors until conditions improve.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "AI tools are changing how students do homework. Teachers are adapting",
    section: "technology", author: 2, hoursAgo: 40, tags: "education, ai, sample",
    summary: "Some schools are banning chatbots while others are building them into lessons.",
    body: [
      "As AI chatbots become part of daily life, schools are taking very different approaches to how students can use them.",
      "Some districts have blocked the tools on school networks. Others are teaching students how to use them responsibly, including how to check their answers.",
      "## What teachers say",
      "Many teachers say they are shifting toward in-class writing and oral presentations, where they can see students’ thinking directly.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Rescue teams reach remote villages cut off by landslides",
    section: "world", author: 1, hoursAgo: 46, tags: "disaster, sample",
    summary: "Aid groups say thousands of people still need food, water and shelter.",
    body: [
      "Rescue teams on Monday reached several mountain villages that had been cut off for four days after heavy rain triggered a series of landslides.",
      "Helicopters are delivering food and medical supplies while crews work to clear roads. Aid groups warn that more rain is forecast later this week.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Families brace for higher heating bills this winter",
    section: "us", author: 3, hoursAgo: 52, tags: "energy, cost of living, sample",
    summary: "Here’s what you can do now to keep costs down and where to find help paying bills.",
    body: [
      "Energy analysts expect heating costs to rise again this winter, particularly for homes that rely on heating oil or propane.",
      "## Ways to save",
      "- Seal drafts around doors and windows\n- Lower the thermostat a few degrees at night\n- Check whether your utility offers budget billing",
      "Many states offer assistance programs for households that need help paying energy bills. Applications often open in the fall.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Rookie quarterback’s breakout season has fans dreaming of a title",
    section: "sports", author: 2, hoursAgo: 60, tags: "football, sample",
    summary: "The first-year starter leads the league in touchdown passes heading into the second half of the season.",
    body: [
      "Few expected much from the rookie quarterback when he was named starter in the preseason. Halfway through the year, he’s one of the most talked-about players in the league.",
      "His coaches credit his preparation and calm under pressure. His teammates say he’s the first one in the building and the last to leave.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
  {
    title: "Beloved animated series returns after a decade with an all-new season",
    section: "entertainment", author: 1, hoursAgo: 70, tags: "television, sample",
    summary: "The show’s original creators are back, along with most of the voice cast.",
    body: [
      "Ten years after its last episode, a fan-favorite animated series is returning with a new season, its streaming service announced Friday.",
      "The original creators are writing every episode, and nearly all of the original voice cast have signed on to return.",
      "This is a sample story included with Report Focus so the site has content to display.",
    ],
  },
];

async function main() {
  mkdirSync("data", { recursive: true });
  const { db } = await import("../src/db");
  const { articles, categories, media, sessions, users } = await import("../src/db/schema");

  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(users);
  if (n > 0 && !force) {
    console.log("Database already has staff accounts. Run with --force to wipe and reseed.");
    return;
  }
  if (force) {
    await db.delete(articles);
    await db.delete(media);
    await db.delete(sessions);
    await db.delete(users);
    await db.delete(categories);
  }

  const hash = await bcrypt.hash(PASSWORD, 11);
  const staff = await db
    .insert(users)
    .values(
      STAFF.map((s) => ({
        ...s,
        slug: s.name.toLowerCase().replace(/\s+/g, "-"),
        passwordHash: hash,
      })),
    )
    .returning();

  const cats = await db
    .insert(categories)
    .values(SECTIONS.map((s, i) => ({ ...s, sortOrder: i })))
    .returning();
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const now = Date.now();
  await db.insert(articles).values(
    SAMPLES.map((s, i) => {
      const publishedAt = new Date(now - s.hoursAgo * 3600e3);
      return {
        title: s.title,
        slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90),
        summary: s.summary,
        body: s.body.join("\n\n"),
        heroImage: `https://picsum.photos/seed/reportfocus-${i + 1}/1600/900`,
        heroCaption: "Sample photo. (Photo: Picsum)",
        tags: s.tags,
        categoryId: catId[s.section],
        authorId: staff[s.author].id,
        status: "published" as const,
        isBreaking: !!s.breaking,
        isFeatured: !!s.featured,
        views: Math.round(Math.random() * 5000),
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt,
      };
    }),
  );

  // A couple of in-progress stories so the newsroom workflow has something to show.
  await db.insert(articles).values([
    {
      title: "School board weighs later start times for high schools",
      slug: "school-board-weighs-later-start-times",
      summary: "Parents and students are split over a proposal to push the first bell to 8:30 a.m.",
      body: "The school board heard more than two hours of public comment on Tuesday...\n\n(Draft in progress.)",
      categoryId: catId.us,
      authorId: staff[2].id,
      status: "review" as const,
      tags: "education",
    },
    {
      title: "Interview notes: local farmers on this year’s harvest",
      slug: "interview-notes-local-farmers-harvest",
      summary: "",
      body: "Notes from interviews. Not ready for review yet.",
      categoryId: catId.business,
      authorId: staff[3].id,
      status: "draft" as const,
    },
  ]);

  console.log("Seeded Report Focus.\n");
  console.log(`Every account below uses the password: ${PASSWORD}`);
  for (const s of STAFF) console.log(`  ${s.role.padEnd(11)} ${s.email}`);
  console.log("\nChange these passwords after your first sign-in.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
