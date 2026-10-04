import Link from "next/link";
import { textLinkVariants } from "@nyaypatra/ui";
import type { UiLocale } from "@/lib/i18n/locale";
import { shellMessages } from "@/lib/i18n/messages/shell";
import { contactEmail, SITE } from "@/lib/site";

export function SiteFooter({ locale }: { locale: UiLocale }) {
  const t = shellMessages[locale].footer;
  const email = contactEmail(process.env);
  const links = [
    { href: "/how-it-works", label: t.links.howItWorks },
    { href: "/legal/disclaimer", label: t.links.disclaimer },
    { href: "/legal/privacy", label: t.links.privacy },
    { href: "/legal/terms", label: t.links.terms },
  ];
  return (
    <footer className="border-t-[3px] border-ink bg-white">
      <div className="mx-auto max-w-[1040px] px-4 py-8">
        <p lang="en" className="font-display text-base font-extrabold">{SITE.name}</p>
        <p className="mt-2 max-w-2xl text-sm font-medium">{t.disclaimer}</p>
        <p className="mt-1 max-w-2xl text-sm font-medium">{t.notAffiliated}</p>
        {email ? (
          <p className="mt-2 max-w-2xl text-sm font-medium">
            {t.contact} <a href={`mailto:${email}`} className={textLinkVariants({ size: "sm" })}>{email}</a>
          </p>
        ) : null}
        <nav aria-label={t.navLabel} className="mt-4">
          <ul role="list" className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={textLinkVariants({ size: "sm" })}>
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
