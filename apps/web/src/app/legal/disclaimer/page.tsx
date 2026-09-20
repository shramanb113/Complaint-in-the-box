import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { getLocale } from "@/lib/i18n/get-locale";
import { shellMessages } from "@/lib/i18n/messages/shell";
import { LEGAL } from "@/lib/legal-content";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer" };

export default async function DisclaimerPage() {
  return (
    <LegalPage doc={LEGAL.disclaimer} locale={await getLocale()} contactEmail={contactEmail(process.env)}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <blockquote lang="en" className="rounded-card border-[3px] border-ink bg-white p-4 text-base font-bold shadow-hard">
          {shellMessages.en.footer.disclaimer}
        </blockquote>
        <blockquote lang="hi" className="rounded-card border-[3px] border-ink bg-white p-4 text-base font-bold shadow-hard">
          {shellMessages.hi.footer.disclaimer}
        </blockquote>
      </div>
    </LegalPage>
  );
}
