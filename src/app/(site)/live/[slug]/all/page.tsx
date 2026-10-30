import type { Metadata } from "next";
import { LiveUpdates, liveMetadata } from "../LiveUpdates";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 15;
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return liveMetadata((await params).slug);
}

/** Every update on a live story, for readers who choose "Show earlier updates". */
export default async function AllLiveUpdatesPage({ params }: Props) {
  return <LiveUpdates slug={(await params).slug} showAll />;
}
