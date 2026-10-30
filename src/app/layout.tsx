import type { Metadata, Viewport } from "next";
import { Libre_Franklin, Newsreader, Playfair_Display, Source_Serif_4 } from "next/font/google";
import { ROBOTS, RSS_ALTERNATE, SHARE_IMAGE } from "@/lib/seo";
import { HOME_DESCRIPTION, HOME_TITLE, TWITTER_HANDLE } from "@/lib/site";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

// Playfair for the masthead, Newsreader for headlines, Source Serif 4 for body text, Libre Franklin for UI.
// Headlines are Newsreader roman at weight 600. The italic cut and the variable weight range were
// preloaded as two files of about 140KB each, and those two requests were the slowest on a phone.
const playfair = Playfair_Display({ subsets: ["latin"], weight: "600", variable: "--font-playfair", display: "swap", preload: false });
const headline = Newsreader({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-newsreader",
  display: "swap",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
  preload: false,
});
const sans = Libre_Franklin({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-franklin", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: HOME_TITLE, template: "%s | Report Focus News" },
  description: HOME_DESCRIPTION,
  robots: ROBOTS,
  openGraph: { siteName: "Report Focus News", locale: "en_ZA", type: "website", images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", site: TWITTER_HANDLE, images: [SHARE_IMAGE] },
  alternates: { types: RSS_ALTERNATE },
  // Proves to Google Search Console that this site belongs to the newsroom's account.
  verification: { google: "Ht1qagqS6RXNU4R7Z9y4Q0IGeht5_Nj0VlQY1g73pfE" },
};

export const viewport: Viewport = { themeColor: "#004666" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${headline.variable} ${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
