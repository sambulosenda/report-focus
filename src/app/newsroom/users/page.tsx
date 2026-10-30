import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { createUser, makeSignInLink, updateUser } from "@/actions/admin";
import { db } from "@/db";
import { articles, ROLE_LABEL, ROLES, users } from "@/db/schema";
import { Avatar } from "@/components/Avatar";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { Card, PageHeader, btnGhost, btnPrimary, inputClass } from "@/components/newsroom/ui";
import { requireUser } from "@/lib/auth";
import { isPendingHash } from "@/lib/invites";

export const metadata: Metadata = { title: "Staff" };

const ROLE_HELP: Record<(typeof ROLES)[number], string> = {
  journalist: "Writes stories and sends them to an editor. Can’t publish.",
  editor: "Approves and publishes stories, schedules them and flags breaking news. Manages sections.",
  admin: "Everything editors can do, plus staff accounts.",
};

export default async function UsersPage() {
  const me = await requireUser("admin");
  const rows = await db
    .select({ user: users, stories: count(articles.id) })
    .from(users)
    .leftJoin(articles, eq(articles.authorId, users.id))
    .groupBy(users.id)
    .orderBy(users.name);
  return (
    <>
      <PageHeader title="Staff" description="Give writers and editors their own sign-in. Writers’ stories wait for an editor before they go live." />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Role and access</th>
                <th className="px-4 py-3">Sign-in link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ user: u, stories }) => (
                <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} url={u.avatarUrl} size={36} />
                      <div>
                        <p className="font-semibold">{u.name}{u.id === me.id && " (you)"}</p>
                        <p className="text-xs text-muted">{u.email} · {stories} stories</p>
                        {isPendingHash(u.passwordHash) && <p className="text-xs font-semibold text-brand-dark">Hasn’t set a password yet</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUser} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} disabled={u.id === me.id} className={`${inputClass} w-32 min-w-28`} aria-label="Role">
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} /> Active
                      </label>
                      {u.id !== me.id && <button className={`${btnGhost} px-3 py-1.5 text-xs`}>Save</button>}
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    {u.active && (
                      <ActionForm action={makeSignInLink} className="w-44">
                        <input type="hidden" name="id" value={u.id} />
                        <button className={`${btnGhost} px-3 py-1.5 text-xs`}>{isPendingHash(u.passwordHash) ? "New invite link" : "Reset link"}</button>
                      </ActionForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="h-fit p-5">
          <h2 className="font-bold">Add someone</h2>
          <ActionForm action={createUser} resetOnSuccess className="mt-3 space-y-3">
            <input name="name" required placeholder="Full name" className={inputClass} aria-label="Full name" />
            <input name="email" type="email" required placeholder="Email" className={inputClass} aria-label="Email" />
            <input name="title" placeholder="Job title, e.g. Political Correspondent" className={inputClass} aria-label="Job title" />
            <select name="role" defaultValue="journalist" className={inputClass} aria-label="Role">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <button className={`${btnPrimary} w-full`}>Add and make invite link</button>
            <p className="text-xs text-muted">You’ll get a link to send them. They choose their own password with it.</p>
          </ActionForm>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
            {ROLES.map((r) => (
              <div key={r}>
                <dt className="font-bold">{ROLE_LABEL[r]}</dt>
                <dd className="text-muted">{ROLE_HELP[r]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
