import Link from "next/link";
import type { UiLocale } from "@/lib/i18n/locale";
import { shellMessages } from "@/lib/i18n/messages/shell";
import { SITE } from "@/lib/site";

export function SiteFooter({ locale }: { locale: UiLocale }) {
  const t = shellMessages[locale].footer;
  const links = [
    { href: "/how-it-works", label: t.links.howItWorks },
    { href: "/legal/disclaimer", label: t.links.disclaimer },
    { href: "/legal/privacy", label: t.links.privacy },
    { href: "/legal/terms", label: t.links.terms },
  ];
  return (
    <footer className="border-t-[3px] border-ink bg-white">
      <div className="mx-auto max-w-[1040px] px-4 py-8">
        <p className="font-display text-base font-extrabold">{SITE.name}</p>
        <p className="mt-2 max-w-2xl text-sm font-medium">{t.disclaimer}</p>
        <p className="mt-1 max-w-2xl text-sm font-medium">{t.notAffiliated}</p>
        <nav aria-label={t.navLabel} className="mt-4">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
