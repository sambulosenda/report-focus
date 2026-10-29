import Link from "next/link";

export function Ticker({ items }: { items: { title: string; href: string }[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex items-stretch border-b border-line bg-mist text-sm">
      <span className="z-10 flex shrink-0 items-center bg-brand px-3 text-xs font-black uppercase tracking-wider text-white">Latest</span>
      <div className="relative flex-1 overflow-hidden">
        <ul className="ticker-track flex w-max gap-10 whitespace-nowrap py-2 pl-6">
          {doubled.map((item, i) => (
            <li key={i} aria-hidden={i >= items.length || undefined}>
              <Link href={item.href} tabIndex={i >= items.length ? -1 : undefined} className="font-medium text-ink hover:text-brand">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
