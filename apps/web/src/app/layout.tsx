import type { Metadata, Viewport } from "next";
import { Baloo_2, Bricolage_Grotesque, Mukta, Space_Mono } from "next/font/google";
import { AnalyticsScript } from "@/components/analytics-script";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { shellMessages } from "@/lib/i18n/messages/shell";
import { SITE } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const baloo = Baloo_2({
  subsets: ["devanagari", "latin"],
  weight: ["600", "800"],
  variable: "--font-baloo",
  display: "swap",
});
const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const meta = shellMessages[await getLocale()].meta;
  return {
    title: { default: meta.title, template: `%s | ${SITE.name}` },
    description: meta.description,
    // Pre-launch: keep out of search until Milestone 4.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${bricolage.variable} ${baloo.variable} ${mukta.variable} ${spaceMono.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <AnalyticsScript />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:border-[3px] focus:border-ink focus:bg-turmeric focus:px-4 focus:py-2 focus:font-display focus:font-extrabold"
        >
          {shellMessages[locale].skipToContent}
        </a>
        <SiteHeader locale={locale} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1040px] flex-1 scroll-mt-20 px-4 py-10 outline-none sm:py-14"
        >
          {children}
        </main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
