import Link from "next/link";
import { Button } from "@nyaypatra/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { shellMessages } from "@/lib/i18n/messages/shell";

export default async function NotFound() {
  const t = shellMessages[await getLocale()].notFound;
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-mono text-sm font-bold">404</p>
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">{t.title}</h1>
      <p className="max-w-md text-lg font-medium">{t.body}</p>
      <Button asChild>
        <Link href="/">{t.home}</Link>
      </Button>
    </div>
  );
}
