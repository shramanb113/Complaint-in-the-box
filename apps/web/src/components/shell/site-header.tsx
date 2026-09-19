import Link from "next/link";
import type { UiLocale } from "@/lib/i18n/locale";
import { shellMessages } from "@/lib/i18n/messages/shell";
import { SITE } from "@/lib/site";
import { LanguageToggle } from "./language-toggle";

export function SiteHeader({ locale }: { locale: UiLocale }) {
  const t = shellMessages[locale];
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream">
      <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-xl font-extrabold tracking-tight">
          {SITE.name}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="hidden min-h-11 items-center font-display text-sm font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric sm:inline-flex"
          >
            {t.nav.howItWorks}
          </Link>
          <LanguageToggle locale={locale} label={t.languageLabel} />
        </div>
      </div>
    </header>
  );
}
