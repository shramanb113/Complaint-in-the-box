import type { ReactNode } from "react";
import type { LegalDocument } from "@/lib/legal-content";
import type { UiLocale } from "@/lib/i18n/locale";
import { shellMessages } from "@/lib/i18n/messages/shell";

interface LegalPageProps {
  doc: LegalDocument;
  locale: UiLocale;
  contactEmail?: string;
  /** Extra content shown above the sections, such as the bilingual disclaimer. */
  children?: ReactNode;
}

/** The legal text is English-only for now, so the article is marked lang="en" even on a Hindi page. */
export function LegalPage({ doc, locale, contactEmail, children }: LegalPageProps) {
  return (
    <article lang="en" className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter sm:text-5xl">{doc.title}</h1>
      <p className="mt-2 font-mono text-xs font-bold">Last updated {doc.updated}</p>
      {locale !== "en" ? (
        <p lang={locale} className="mt-4 rounded-card border-[2.5px] border-ink bg-butter p-3 text-sm font-bold">
          {shellMessages[locale].englishOnly}
        </p>
      ) : null}
      {children}
      <p className="mt-6 text-lg font-medium">{doc.summary}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-base font-medium">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-base font-medium">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      {contactEmail ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Contact</h2>
          <p className="mt-2 text-base font-medium">
            Questions about your data or these terms:{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex min-h-11 items-center font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric"
            >
              {contactEmail}
            </a>
          </p>
        </section>
      ) : null}
    </article>
  );
}
