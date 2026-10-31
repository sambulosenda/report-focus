import type { Metadata } from "next";
import { WhatsAppJoin } from "@/components/WhatsAppJoin";
import { SITE_NAME } from "@/lib/site";
import { whatsappChannelUrl } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const open = Boolean(whatsappChannelUrl());
  return {
    title: "WhatsApp briefing",
    description: `The morning briefing and breaking alerts from ${SITE_NAME}, on WhatsApp.`,
    alternates: open ? { canonical: "/whatsapp" } : undefined,
    robots: open ? undefined : { index: false, follow: false },
  };
}

export default function WhatsAppPage() {
  return (
    <div className="mx-auto max-w-[780px] px-4 pb-16 pt-8 md:px-6 md:pt-12">
      <h1 className="headline border-b-[3px] border-ink pb-[18px] text-[32px] leading-[1.1] md:text-[44px]">The briefing on WhatsApp</h1>
      <div className="mt-6 max-w-[640px] space-y-4 text-[17px] leading-normal text-ink-2">
        <p>Five stories each weekday morning, and a short note when news breaks.</p>
        <p>Each one is a headline, a sentence, and a link back to the story. You join the channel with one tap. There is no account to create on this site.</p>
      </div>
      <WhatsAppJoin placement="page" />
    </div>
  );
}
