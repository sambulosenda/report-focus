# South Africa local election results, 2026

Public page: `/elections/south-africa-2026`. Editorial controls: **Newsroom → Election results** (editors and admins).

This first version covers **municipal proportional-representation ballots**, one result per municipality code. Ward contests, district PR ballots, seat allocation, council control and automatic IEC imports are outside this version. Do not combine their vote totals with municipal PR votes.

## Before publishing

1. Run `npm run db:migrate` in the target environment. This adds results and revision-history tables without seeding election figures.
2. Open **Election results** in the newsroom and add the official municipality code, municipality and province.
3. Enter every party's municipal PR votes, spoiled ballots and total ballots counted. The totals must balance. Add registered voters and both station counts if the source supplies them; leave unknown figures blank.
4. Add the source name, HTTPS link and source timestamp in **SAST (UTC+2)**. Set provisional/final to match the source. A completed station count alone does not imply a final declaration.
5. Check the verification box and select Publish. Only verified results dated on or after 4 November 2026 can be published, and publication is blocked before that day. Otherwise save a draft.

Open an existing municipality from the list to update it. Each save records a revision and editor. Conflicting saves are rejected: reload to see the other editor's changes. Uncheck Publish to withdraw a result; its saved revisions remain. Use the public note to explain changes to published figures. History shows the latest 20 revisions.

Vote-share percentages exclude spoiled ballots. The provisional ballot-to-registration percentage is **not final turnout**. Unknown station totals or registered voters display as “Not reported”. Missing results are never interpreted as zero votes or a national count.

Readers can filter by province and municipality, and use Refresh results to fetch the latest editorial update. The page does not automatically poll or ingest an IEC feed.

## Demo and tests

`/elections/south-africa-2026?demo=1` displays fictional party names and totals with prominent demo labels and noindex metadata. Demo data is not stored in the database and is never mixed with verified results. The ordinary public page starts with “Awaiting verified results”.

`npm run test:elections` uses an isolated in-memory database and checks vote arithmetic, dates, permissions, source URL validation, duplicate councils, drafts, publication, withdrawals, conflicts and saved revisions.

## Official references

- [Election date announcement](https://www.sanews.gov.za/south-africa/minister-gazettes-date-local-government-elections)
- [IEC municipal ballot guide](https://www.elections.org.za/pw/Documents/Outreach/Factsheets/Municipal/IEC%20Municipal%20Elections%20Factsheet.pdf)

Election day is currently listed as 4 November 2026. If the official date changes, update the date gate and public copy together in `src/lib/elections.ts`, the public page, and publishing validation.
