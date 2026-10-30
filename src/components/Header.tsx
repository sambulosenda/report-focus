import Link from "next/link";
import { currentLiveStory, navCategories } from "@/lib/queries";
import { formatLongDate } from "@/lib/utils";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { SiteNav } from "./SiteNav";
import { SearchIcon } from "./icons";
import { storyHref } from "./Story";

export async function Header() {
  // The header also frames error and 404 pages, so a database outage leaves it with just the basics.
  // It reads no sign-in cookie, so reader pages can be cached for everyone. Staff signed in already are sent on from /login.
  const [cats, live] = await Promise.all([navCategories().catch(() => []), currentLiveStory().catch(() => null)]);
  const sections = cats.map((c) => ({ label: c.name, href: `/${c.slug}` }));
  const nav = [{ label: "Video", href: "/video" }, ...sections];

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-1.5 md:h-auto md:flex-wrap md:gap-x-5 md:gap-y-2 md:px-6 md:pb-2 md:pt-3">
        <div className="md:flex-[1_1_180px]">
          <MobileMenu sections={nav} live={live ? { title: live.title, href: storyHref(live) } : null} />
          <div className="hidden text-[13px] leading-snug text-muted md:block">
            <p className="font-bold text-ink">{formatLongDate(new Date())}</p>
            <p>U.S. edition</p>
          </div>
        </div>
        <Link href="/" aria-label="Report Focus News home" className="hover:no-underline">
          <Logo className="text-[22px] md:text-[clamp(30px,2.8vw,40px)]" />
        </Link>
        <div className="flex items-center justify-end gap-2.5 md:flex-[1_1_180px]">
          <Link href="/search" aria-label="Search" className="inline-flex h-11 w-11 items-center justify-center text-ink hover:text-teal">
            <SearchIcon />
          </Link>
          <Link
            href="/login"
            className="hidden h-11 items-center bg-teal px-[18px] text-sm font-bold text-white hover:bg-teal-hover md:inline-flex"
          >
            Sign in
          </Link>
        </div>
      </div>
      <SiteNav items={nav} />
    </header>
  );
}
