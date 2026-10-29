import type { Metadata } from "next";
import Link from "next/link";
import { changePassword } from "@/actions/auth";
import { updateProfile } from "@/actions/admin";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { Card, PageHeader, btnPrimary, inputClass } from "@/components/newsroom/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My profile" description="This is what readers see on your byline and author page.">
        <Link href={`/author/${user.slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">View author page ↗</Link>
      </PageHeader>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Byline</h2>
          <ActionForm action={updateProfile} className="space-y-3">
            <label className="block text-sm font-semibold">Name<input name="name" required defaultValue={user.name} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-semibold">Job title<input name="title" defaultValue={user.title ?? ""} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-semibold">Photo URL<input name="avatarUrl" defaultValue={user.avatarUrl ?? ""} placeholder="Upload in the image library, then paste the URL" className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-semibold">Bio<textarea name="bio" rows={4} defaultValue={user.bio ?? ""} className={`${inputClass} mt-1`} /></label>
            <button className={btnPrimary}>Save profile</button>
          </ActionForm>
        </Card>
        <Card className="h-fit p-5">
          <h2 className="mb-3 font-bold">Change password</h2>
          <ActionForm action={changePassword} className="space-y-3" resetOnSuccess>
            <label className="block text-sm font-semibold">Current password<input name="current" type="password" required autoComplete="current-password" className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-semibold">New password<input name="next" type="password" required minLength={10} autoComplete="new-password" className={`${inputClass} mt-1`} /></label>
            <button className={btnPrimary}>Update password</button>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
