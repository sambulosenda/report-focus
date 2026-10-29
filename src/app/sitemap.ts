import type { MetadataRoute } from "next";
import { allCategories, latestStories } from "@/lib/queries";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, stories] = await Promise.all([allCategories(), latestStories(1000)]);
  return [
    { url: siteUrl("/"), changeFrequency: "always", priority: 1 },
    ...cats.map((c) => ({ url: siteUrl(`/${c.slug}`), changeFrequency: "hourly" as const, priority: 0.8 })),
    ...stories.map((s) => ({ url: siteUrl(`/${s.category?.slug ?? "news"}/${s.slug}`), lastModified: s.publishedAt ?? undefined, priority: 0.6 })),
  ];
}
