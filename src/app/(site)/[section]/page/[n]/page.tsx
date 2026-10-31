import { notFound, permanentRedirect } from "next/navigation";
import { SectionPage, generateMetadata as sectionMetadata } from "@/components/SectionPage";
import { categoryBySlug } from "@/lib/queries";
export const revalidate = 60;
export const dynamic = "force-static";
type Props = { params: Promise<{ section: string; n: string }> };
async function props({ params }: Props) {
  const { section, n } = await params;
  if (!/^[1-9]\d*$/.test(n) || !Number.isSafeInteger(Number(n)) || !await categoryBySlug(section)) notFound();
  if (n === "1") permanentRedirect(`/${section}`);
  return { params: Promise.resolve({ section }), pageNumber: Number(n) };
}
export async function generateMetadata(input: Props) { return sectionMetadata(await props(input)); }
export default async function Page(input: Props) { return SectionPage(await props(input)); }
