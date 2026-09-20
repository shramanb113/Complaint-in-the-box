import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@nyaypatra/ui";
import { fill } from "@/lib/i18n/define";
import { getLocale } from "@/lib/i18n/get-locale";
import { newStubMessages } from "@/lib/i18n/messages/new-stub";
import { pickerMessages } from "@/lib/i18n/messages/picker";
import { parseNewRoute } from "@/lib/new-route";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ template?: string | string[] }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { category } = await params;
  const route = parseNewRoute(category, undefined);
  if (!route) return {};
  return { title: pickerMessages[await getLocale()].categories[route.category].title };
}

/** Stub until Milestone 3 builds the intake form; the route and its validation are the part that stays. */
export default async function NewComplaintPage({ params, searchParams }: Props) {
  const [{ category }, { template }] = await Promise.all([params, searchParams]);
  const route = parseNewRoute(category, template);
  if (!route) notFound();

  const locale = await getLocale();
  const t = newStubMessages[locale];
  const picker = pickerMessages[locale];

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <p className="font-mono text-xs hi:text-sm font-bold uppercase tracking-wide">{picker.categories[route.category].title}</p>
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">{t.title}</h1>
      {route.templateId ? (
        <p className="text-lg font-bold">{fill(t.picked, { template: picker.templates[route.templateId] })}</p>
      ) : null}
      <p className="text-lg font-medium">{t.body}</p>
      <Button asChild variant="secondary">
        <Link href="/#start">{t.back}</Link>
      </Button>
    </div>
  );
}
