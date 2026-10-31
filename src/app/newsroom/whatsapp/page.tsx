import type { Metadata } from "next";
import { markBreakingPosted, markBriefingPosted } from "@/actions/whatsapp";
import { CopyText } from "@/components/newsroom/CopyText";
import { ActionForm } from "@/components/newsroom/ActionForm";
import { ConfirmButton } from "@/components/newsroom/ConfirmButton";
import { Card, PageHeader } from "@/components/newsroom/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/utils";
import { currentBreaking, currentBriefing, postedBreaking, postedBriefing, recentWhatsAppPosts, whatsappChannelUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "WhatsApp" };

export default async function WhatsAppAdminPage() {
  await requireUser("editor");
  const channel = whatsappChannelUrl();
  const briefing = await currentBriefing();
  const breaking = await currentBreaking();
  const [morning, alert, recent] = await Promise.all([
    postedBriefing(briefing.date),
    breaking ? postedBreaking(breaking.articleId) : Promise.resolve(undefined),
    recentWhatsAppPosts(),
  ]);

  return (
    <>
      <PageHeader title="WhatsApp" description="The morning briefing and breaking posts for the channel. Copy the text into WhatsApp, then mark it posted." />
      <div className="space-y-6 p-4 md:p-6 md:px-8">
        {channel ? (
          <p className="text-sm text-muted">
            Readers join at{" "}
            <a href={channel} className="font-bold text-teal hover:underline" target="_blank" rel="noopener noreferrer">
              {channel.replace(/^https:\/\//, "")}
            </a>
            . The site does not collect phone numbers.
          </p>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The join button is hidden until <code>WHATSAPP_CHANNEL_URL</code> is the channel invite, a link starting with{" "}
            <code>https://whatsapp.com/channel/</code>. You can still prepare posts.
          </p>
        )}

        <PostCard
          title="Morning briefing"
          empty="No stories were published in the past 24 hours, so there is nothing to post."
          body={briefing.body}
          posted={morning}
          action={markBriefingPosted}
          confirm="Mark today’s briefing as posted? Paste it into the channel first. This can’t be undone."
        />

        <PostCard
          title="Breaking"
          empty="The breaking banner is off, so there is no alert to post."
          body={breaking?.body ?? null}
          posted={alert}
          action={markBreakingPosted}
          confirm="Mark this breaking alert as posted? Paste it into the channel first. This can’t be undone."
        />

        <Card>
          <h2 className="border-b border-line px-[18px] py-3.5 font-bold">Recent posts</h2>
          {recent.length === 0 ? (
            <p className="px-[18px] py-4 text-sm text-muted">Nothing has been marked as posted yet.</p>
          ) : (
            <ul>
              {recent.map(({ post, by }) => (
                <li key={post.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-[18px] py-3 text-sm last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="font-bold">{post.kind === "breaking" ? "Breaking" : "Morning briefing"}</span>
                    <span className="block truncate text-muted">{postPreview(post.kind, post.body)} · {by ?? "Editor"}</span>
                  </span>
                  <span className="text-muted tabular">
                    {formatDate(post.createdAt)}, {formatTime(post.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function postPreview(kind: string, body: string) {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  if (kind === "breaking") return lines[1] ?? "Breaking";
  return lines[0] ?? "Morning briefing";
}

function PostCard({
  title,
  empty,
  body,
  posted,
  action,
  confirm,
}: {
  title: string;
  empty: string;
  body: string | null;
  posted: { post: { body: string; createdAt: Date }; by: string | null } | undefined;
  action: (prev: { ok?: string; error?: string } | undefined, formData: FormData) => Promise<{ ok?: string; error?: string } | undefined>;
  confirm: string;
}) {
  const text = posted?.post.body ?? body;
  return (
    <Card>
      <h2 className="border-b border-line px-[18px] py-3.5 font-bold">{title}</h2>
      <div className="px-[18px] py-4">
        {!text ? (
          <p className="text-sm text-muted">{empty}</p>
        ) : (
          <>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{text}</pre>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyText text={text} label="Copy post" />
              {posted ? (
                <p className="text-sm text-muted">
                  Posted {formatDate(posted.post.createdAt)}, {formatTime(posted.post.createdAt)}
                  {posted.by ? ` · ${posted.by}` : ""}
                </p>
              ) : (
                body && (
                  <ActionForm action={action} className="flex flex-col items-start">
                    <textarea name="body" readOnly hidden value={body} />
                    <ConfirmButton className="font-bold text-teal hover:underline" message={confirm}>
                      Mark as posted
                    </ConfirmButton>
                  </ActionForm>
                )
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
