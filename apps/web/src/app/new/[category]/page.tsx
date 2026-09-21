import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, cn, textLinkVariants } from "@nyaypatra/ui";
import { IntakeForm } from "@/components/intake/intake-form";
import { Kicker } from "@/components/kicker";
import { SituationLink } from "@/components/situation-link";
import { templatesByCategory } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n/get-locale";
import { intakeMessages } from "@/lib/i18n/messages/intake";
import { packetMessages } from "@/lib/i18n/messages/packet";
import { pickerMessages } from "@/lib/i18n/messages/picker";
import { shellMessages } from "@/lib/i18n/messages/shell";
import { todayIstIso } from "@/lib/intake/dates";
import { parseNewRoute } from "@/lib/new-route";
import { submitIntakeAction } from "./actions";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ template?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ category }, { template }] = await Promise.all([params, searchParams]);
  const route = parseNewRoute(category, template);
  if (!route) return {};
  const picker = pickerMessages[await getLocale()];
  return { title: route.templateId ? picker.templates[route.templateId] : picker.categories[route.category].title };
}

const heading = "font-display text-4xl font-extrabold leading-tight tracking-tighter";

export default async function NewComplaintPage({ params, searchParams }: Props) {
  const [{ category }, { template }] = await Promise.all([params, searchParams]);
  const route = parseNewRoute(category, template);
  if (!route) notFound();

  const locale = await getLocale();
  const t = intakeMessages[locale];
  const picker = pickerMessages[locale];

  if (!route.templateId) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <Kicker className="mb-1">{picker.categories[route.category].title}</Kicker>
          <h1 className={heading}>{t.page.listTitle}</h1>
          <p className="mt-2 text-base font-medium">{t.page.listHint}</p>
        </div>
        <ul role="list" className="grid gap-3">
          {templatesByCategory()[route.category].map((id) => (
            <li key={id}>
              <SituationLink href={`/new/${route.category}?template=${id}`} label={picker.templates[id]} />
            </li>
          ))}
        </ul>
        <Button asChild variant="secondary" className="self-start">
          <Link href="/#start">{t.page.back}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <Kicker className="mb-1">{t.page.formKicker}</Kicker>
        <h1 className={heading}>{picker.templates[route.templateId]}</h1>
        <p className="mt-2 text-base font-medium">{t.page.formIntro}</p>
      </div>
      <Link
        href={`/new/${route.category}`}
        className={cn(textLinkVariants({ size: "sm" }), "self-start")}
      >
        {t.page.change}
      </Link>
      <IntakeForm
        templateId={route.templateId}
        locale={locale}
        strings={t}
        packetStrings={packetMessages[locale]}
        disclaimer={shellMessages[locale].footer.disclaimer}
        today={todayIstIso()}
        action={submitIntakeAction}
      />
    </div>
  );
}
