import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { getLocale } from "@/lib/i18n/get-locale";
import { LEGAL } from "@/lib/legal-content";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

export default async function TermsPage() {
  return <LegalPage doc={LEGAL.terms} locale={await getLocale()} contactEmail={contactEmail(process.env)} />;
}
