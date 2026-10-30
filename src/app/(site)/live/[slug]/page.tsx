import type { Metadata } from "next";
import { LiveUpdates, liveMetadata } from "./LiveUpdates";

type Props = { params: Promise<{ slug: string }> };

// Cached briefly so a big live story doesn't send every reader to the database. Posting an update refreshes it at once.
export const revalidate = 15;
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return liveMetadata((await params).slug);
}

export default async function LiveUpdatesPage({ params }: Props) {
  return <LiveUpdates slug={(await params).slug} showAll={false} />;
}
