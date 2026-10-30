import Link from "next/link";
import { navCategories } from "@/lib/queries";
import { FOOTER_LINKS, SOCIAL, TAGLINE } from "@/lib/site";
import { Logo } from "./Logo";
import { SOCIAL_ICONS } from "./icons";

const heading = "mb-3.5 text-xs font-extrabold uppercase tracking-[0.08em] text-white";
const link = "flex min-h-10 items-center text-sm text-on-teal hover:text-white md:block md:min-h-0";

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className={heading}>{title}</h2>
      <ul className="flex flex-col md:gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className={link}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The one footer used on every reader page. */
export async function Footer() {
  const cats = await navCategories();
  // Two columns, filled top to bottom.
  const half = Math.ceil(cats.length / 2);
  const ordered = cats.slice(0, half).flatMap((c, i) => [c, cats[half + i]]).filter(Boolean);

  return (
    <footer className="bg-teal-deep text-on-teal">
      <div className="mx-auto max-w-[1280px] px-4 pt-8 md:px-6 md:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-teal-line pb-8">
          <div>
            <Link href="/" aria-label="Report Focus News home" className="hover:no-underline">
              <Logo dark className="text-[28px] leading-[1.1]" />
            </Link>
            <p className="mt-2 text-sm leading-normal text-on-teal-muted">{TAGLINE}</p>
          </div>
          <ul aria-label="Follow Report Focus News" className="flex gap-2.5">
            {SOCIAL.map(({ name, url }) => {
              const Icon = SOCIAL_ICONS[name];
              const circle = "inline-flex h-10 w-10 items-center justify-center rounded-full border border-teal-line text-white";
              return (
                <li key={name}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Report Focus News on ${name}`} className={`${circle} hover:bg-teal-line`}>
                      <Icon size={name === "YouTube" ? 17 : 15} />
                    </a>
                  ) : (
                    <span role="img" aria-label={name} className={circle}>
                      <Icon size={name === "YouTube" ? 17 : 15} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-7 pb-8 pt-7 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] md:gap-8 md:pb-10 md:pt-8">
          <div className="col-span-2 md:col-span-1">
            <h2 className={heading}>Sections</h2>
            <ul className="grid grid-cols-2 gap-x-4 md:gap-y-2.5">
              {ordered.map((c) => (
                <li key={c.id}>
                  <Link href={`/${c.slug}`} className={link}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <LinkColumn title="Watch & listen" links={FOOTER_LINKS.watch} />
          <LinkColumn title="Company" links={FOOTER_LINKS.company} />
          <LinkColumn title="Standards & help" links={FOOTER_LINKS.help} />
        </nav>
      </div>
      <div className="border-t border-teal-line">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2.5 px-4 py-[18px] text-xs text-on-teal-muted md:px-6">
          <span>© {new Date().getFullYear()} Report Focus News. All rights reserved.</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1.5">
            {FOOTER_LINKS.legal.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white">{l.label}</Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
