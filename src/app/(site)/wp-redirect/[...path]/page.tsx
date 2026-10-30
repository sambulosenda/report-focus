import { redirectLegacyOrNotFound } from "@/lib/legacy-redirect";

// Old WordPress addresses that no other page matches (such as /2021/04/12/my-story/ or /?p=123)
// are rewritten here by next.config.ts.
type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<{ p?: string }> };

export default async function LegacyRedirect({ params, searchParams }: Props) {
  const [{ path }, { p }] = await Promise.all([params, searchParams]);
  const pathname = path[0] === "_home" ? "/" : `/${path.join("/")}`;
  return redirectLegacyOrNotFound(pathname, p);
}
