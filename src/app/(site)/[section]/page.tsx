import { SectionPage, generateMetadata as sectionMetadata } from "@/components/SectionPage";
export const revalidate = 60;
export const dynamic = "force-static";
type Props = { params: Promise<{ section: string }> };
export async function generateMetadata({ params }: Props) { return sectionMetadata({ params }); }
export default async function Page({ params }: Props) { return SectionPage({ params }); }
