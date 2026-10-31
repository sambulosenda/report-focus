import { whatsappChannelUrl } from "@/lib/whatsapp";

const join = "font-bold text-teal hover:underline";

/** One-tap channel invite. Hidden until WHATSAPP_CHANNEL_URL is a channel link. */
export function WhatsAppJoin({ placement }: { placement: "home" | "newsletters" | "page" }) {
  const url = whatsappChannelUrl();
  if (!url) {
    if (placement !== "page") return null;
    return <p className="mt-6 text-[15px] text-muted">The channel is not open yet.</p>;
  }
  if (placement === "page") {
    return (
      <div className="mt-8">
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-[46px] items-center bg-teal px-5 text-[15px] font-bold text-white hover:bg-teal-hover hover:no-underline">
          Join on WhatsApp
        </a>
      </div>
    );
  }
  if (placement === "home") {
    return (
      <p className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-4 text-sm text-ink-2 md:px-6">
        <span>The same five stories, on WhatsApp, each weekday morning.</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className={join}>
          Join on WhatsApp
        </a>
      </p>
    );
  }
  return (
    <p className="mt-4 max-w-[640px] text-[15px] leading-normal text-ink-2">
      The morning briefing and breaking alerts are also on our channel.{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className={join}>
        Join on WhatsApp
      </a>
    </p>
  );
}
