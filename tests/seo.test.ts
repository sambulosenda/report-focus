import assert from "node:assert/strict";
import { test } from "node:test";
import { metaDescription, sectionMetaDescription } from "../src/lib/seo";
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

test("topic eligibility ignores wire copy and duplicate spellings in one story", () => {
  const row = { tags: "Cyril Ramaphosa,cyril-ramaphosa", updatedAt: new Date(), author: {name: "Reporter"} };
  assert.equal(topicIndex([row]).size, 0);
  assert.equal(topicIndex(Array.from({length: TAG_INDEX_MIN - 1}, () => row)).size, 0);
  const eligible = topicIndex(Array.from({length: TAG_INDEX_MIN}, () => row));
  assert.equal(eligible.get("cyril-ramaphosa")?.n, TAG_INDEX_MIN);
  for (const [, topic] of eligible) assert.ok(topic.n >= TAG_INDEX_MIN);
  assert.equal(topicIndex(Array.from({length: 10}, () => ({...row, author: {name: "Reuters"}}))).size, 0);
});

test("404 fallback has a visible recovery heading and only noindex", async () => {
  const { NOT_FOUND_HTML } = await import("../src/lib/not-found-response");
  assert.equal((NOT_FOUND_HTML.match(/<h1/g) ?? []).length, 1);
  assert.equal((NOT_FOUND_HTML.match(/name="robots"/g) ?? []).length, 1);
  assert.match(NOT_FOUND_HTML, /content="noindex"/);
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
