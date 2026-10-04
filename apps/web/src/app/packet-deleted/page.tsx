import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@nyaypatra/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { packetMessages } from "@/lib/i18n/messages/packet";

export async function generateMetadata(): Promise<Metadata> {
  return { title: packetMessages[await getLocale()].deleted.title, robots: { index: false, follow: false } };
}

export default async function PacketDeletedPage() {
  const t = packetMessages[await getLocale()].deleted;
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">{t.title}</h1>
      <p className="max-w-md text-lg font-medium">{t.body}</p>
      <Button asChild>
        <Link href="/">{t.home}</Link>
      </Button>
    </div>
  );
}
