"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadImage } from "@/actions/articles";
import { btnBrand, inputClass } from "./ui";

export function MediaUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    const res = await uploadImage(fd);
    setBusy(false);
    if (res.error) return setMsg({ error: res.error });
    form.reset();
    setMsg({ ok: "Uploaded." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-5">
      <label className="block text-sm font-bold">
        Image
        <input name="file" type="file" accept="image/*" required className="mt-1 block text-sm font-normal" />
      </label>
      <label className="block min-w-[240px] flex-1 text-sm font-bold">
        Description (alt text)
        <input name="alt" placeholder="What the image shows, for screen readers" className={`${inputClass} mt-1 font-normal`} />
      </label>
      <button disabled={busy} className={btnBrand}>{busy ? "Uploading…" : "Upload"}</button>
      {msg?.error && <p className="w-full text-sm font-semibold text-brand-dark">{msg.error}</p>}
      {msg?.ok && <p className="w-full text-sm font-semibold text-emerald-700">{msg.ok}</p>}
    </form>
  );
}
