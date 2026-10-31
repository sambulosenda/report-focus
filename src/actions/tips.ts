"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { sendEmails } from "@/lib/email";
import { consumeTipAttempt, clientIp } from "@/lib/rate-limit";
import { closeTip, deleteTip, saveTip, TIP_RECEIVED, TIP_SLOW_DOWN, tipWaitingEmail } from "@/lib/tips";

export type TipState = { ok?: string; error?: string } | undefined;

export async function submitTip(_prev: TipState, formData: FormData): Promise<TipState> {
  // Bots that fill every field are told the tip arrived. Nothing is stored.
  if (String(formData.get("website") ?? "").trim()) return { ok: TIP_RECEIVED };
  if (!(await consumeTipAttempt(await clientIp()))) return { error: TIP_SLOW_DOWN };

  const result = await saveTip({
    body: formData.get("body"),
    name: formData.get("name"),
    contact: formData.get("contact"),
    anonymous: formData.get("anonymous") === "1",
  });
  if ("error" in result) return { error: result.error };

  try {
    await sendEmails([tipWaitingEmail(result.id, result.anonymous)]);
  } catch (err) {
    console.error(err);
  }
  return { ok: result.ok };
}

async function changeTip(formData: FormData, intent: "close" | "delete"): Promise<FormState> {
  const user = await requireUser("editor");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "That tip is no longer here." };
  const result = intent === "delete" ? await deleteTip(user, id) : await closeTip(user, id);
  revalidatePath("/newsroom", "layout");
  revalidatePath("/newsroom/tips");
  revalidatePath(`/newsroom/tips/${id}`);
  if (result.ok && intent === "delete") redirect("/newsroom/tips");
  return result;
}

export async function closeTipAction(_prev: FormState, formData: FormData) {
  return changeTip(formData, "close");
}

export async function deleteTipAction(_prev: FormState, formData: FormData) {
  return changeTip(formData, "delete");
}
