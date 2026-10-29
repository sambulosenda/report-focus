import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { deleteCategory, saveCategory } from "@/actions/admin";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { Card, PageHeader, btnGhost, btnPrimary, inputClass } from "@/components/newsroom/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sections" };

function CategoryFields({ c }: { c?: typeof categories.$inferSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px_70px]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <input name="name" defaultValue={c?.name} placeholder="Name" required className={inputClass} aria-label="Name" />
      <input name="slug" defaultValue={c?.slug} placeholder="url (optional)" className={`${inputClass} font-mono`} aria-label="URL" />
      <input name="color" type="color" defaultValue={c?.color ?? "#1d4ed8"} className="h-9 w-full rounded border border-line" aria-label="Colour" />
      <input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className={inputClass} aria-label="Order" />
      <input name="description" defaultValue={c?.description ?? ""} placeholder="Short description shown on the section page" className={`${inputClass} sm:col-span-3`} aria-label="Description" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="inNav" defaultChecked={c?.inNav ?? true} /> In menu
      </label>
    </div>
  );
}

export default async function CategoriesPage() {
  await requireUser("editor");
  const rows = await db
    .select({ category: categories, stories: count(articles.id) })
    .from(categories)
    .leftJoin(articles, eq(articles.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.sortOrder, categories.name);
  return (
    <>
      <PageHeader title="Sections" description="Sections appear in the site menu and on the homepage in this order." />
      <div className="space-y-6 p-6">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Add a section</h2>
          <ActionForm action={saveCategory} resetOnSuccess>
            <CategoryFields />
            <button className={`${btnPrimary} mt-3`}>Add section</button>
          </ActionForm>
        </Card>
        <div className="space-y-3">
          {rows.map(({ category: c, stories }) => (
            <Card key={c.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: c.color }} /> {c.name}
                  <span className="text-sm font-normal text-muted">/{c.slug} · {stories} stories</span>
                </h3>
                {stories === 0 && (
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-sm font-semibold text-brand-dark hover:underline">Delete</button>
                  </form>
                )}
              </div>
              <ActionForm action={saveCategory}>
                <CategoryFields c={c} />
                <button className={`${btnGhost} mt-3`}>Save</button>
              </ActionForm>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
