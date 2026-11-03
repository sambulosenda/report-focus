import assert from "node:assert/strict";
import { test } from "node:test";
import { authorMetaDescription, metaDescription, sectionMetaDescription } from "../src/lib/seo";
import { topicIndex } from "../src/lib/topic-index";
import { TAG_INDEX_MIN } from "../src/lib/tags";

test("metadata preserves abbreviations and does not invent sentence endings", () => {
  const samples = [
    "President Emmerson Mnangagwa signed the Constitution of Zimbabwe Amendment (No. 3) Act into law on Tuesday, lengthening presidential and parliamentary terms from five to seven years.",
    "Rwanda has said it would withdraw from the Economic Community of Central African States (ECCAS), underscoring diplomatic tensions in the region over an offensive this year.",
  ];
  for (const sample of samples) {
    const result = metaDescription(sample);
    assert.ok(result.length <= 155);
    assert.doesNotMatch(result, /(?:parliamentary|No| an)\.$|…$/);
    assert.ok(sample.startsWith(result));
  }
  assert.equal(metaDescription("A short standfirst"), "A short standfirst");
  const sentence = "The authorities published the full report on Tuesday after reviewing the evidence.";
  assert.equal(metaDescription(`${sentence} ${"More details follow ".repeat(10)}`), sentence);
});

test("legacy bylines and datelines do not leak into metadata", () => {
  assert.doesNotMatch(metaDescription("Muhoozi vs Trump is not a tweet-war — it’s Uganda’s election crisis entering Washington’s bloodstream By Brilliant Pongo Report Focus News | Political Analyst & Editor’s Desk The Update Uganda’s Chief of Defence Forces, Gen. Muhoozi Kainerugaba, has issued a public warning aimed at U.S. President…"), /By Brilliant|\|/);
  assert.equal(metaDescription("KIGALI, Rwanda – The report was released."), "The report was released.");
  assert.doesNotMatch(sectionMetaDescription({slug: "us", name: "US"}), /independent reporting and analysis on Zimbabwe/);
});

test("section and author descriptions are full sentences search engines can quote", () => {
  for (const slug of ["zimbabwe", "south-africa", "africa", "us", "world", "politics", "business", "technology", "health", "climate", "sports", "entertainment", "crime"]) {
    const d = sectionMetaDescription({slug, name: slug});
    assert.ok(d.length >= 120 && d.length <= 155 && d.endsWith("."), `${slug}: ${d}`);
  }
  const author = authorMetaDescription("Mickal Dube", null);
  assert.match(author, /Mickal Dube/);
  assert.ok(author.length >= 120 && author.endsWith("."), author);
});

test("topic eligibility ignores wire copy and duplicate spellings in one story", () => {
  const row = { tags: "Cyril Ramaphosa,cyril-ramaphosa", updatedAt: new Date(), author: {name: "Reporter"} };
  assert.equal(topicIndex([row]).size, 0);
  assert.equal(topicIndex(Array.from({length: TAG_INDEX_MIN - 1}, () => row)).size, 0);
  const eligible = topicIndex(Array.from({length: TAG_INDEX_MIN}, () => row));
  assert.equal(eligible.get("cyril-ramaphosa")?.n, TAG_INDEX_MIN);
  for (const [, topic] of eligible) assert.ok(topic.n >= TAG_INDEX_MIN);
  assert.equal(topicIndex(Array.from({length: 10}, () => ({...row, author: {name: "Reuters"}}))).size, 0);
});

test("section pagination redirects without affecting latest or newsroom access", async () => {
  const { NextRequest } = await import("next/server");
  const { middleware } = await import("../src/middleware");
  const section = await middleware(new NextRequest("https://reportfocusnews.com/zimbabwe?page=2"));
  assert.equal(section.status, 308);
  assert.equal(section.headers.get("location"), "https://reportfocusnews.com/zimbabwe/page/2");
  const latest = await middleware(new NextRequest("https://reportfocusnews.com/latest?page=2"));
  assert.equal(latest.headers.get("location"), null);
  const newsroom = await middleware(new NextRequest("https://reportfocusnews.com/newsroom"));
  assert.equal(newsroom.status, 307);
  assert.match(newsroom.headers.get("location")!, /\/login\?next=/);
});

test("training opt-outs leave search bots under the public allow rule", async () => {
  const { default: robots } = await import("../src/app/robots");
  const rules = robots().rules;
  assert.ok(Array.isArray(rules));
  assert.deepEqual(rules[1].disallow, "/");
  assert.ok(Array.isArray(rules[1].userAgent) && rules[1].userAgent.includes("GPTBot"));
  assert.ok(!JSON.stringify(rules[1]).includes("OAI-SearchBot"));
});

test("Google News exclusions use a separate meta tag and leave articles eligible", async () => {
  const { pageMeta } = await import("../src/lib/seo");
  const hub = pageMeta({ title: "US News", path: "/us", noNewsIndex: true });
  assert.deepEqual(hub.other, { "googlebot-news": "noindex" });
  assert.equal((hub.robots as { index: boolean }).index, true);
  const article = pageMeta({ title: "A story", path: "/us/a-story" });
  assert.equal(article.other, undefined);
  assert.equal((article.robots as { index: boolean }).index, true);
});
