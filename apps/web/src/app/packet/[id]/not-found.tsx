import Link from "next/link";
import { Button } from "@nyaypatra/ui";
import { fill } from "@/lib/i18n/define";
import { getLocale } from "@/lib/i18n/get-locale";
import { packetMessages } from "@/lib/i18n/messages/packet";
import { PACKET_TTL_DAYS } from "@/server/store/types";

/** Shown for a letter link that is unknown or has expired (we cannot, and should not, tell which). */
export default async function PacketNotFound() {
  const t = packetMessages[await getLocale()].expired;
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">{t.title}</h1>
      <p className="text-lg font-medium">{fill(t.body, { days: PACKET_TTL_DAYS })}</p>
      <Button asChild size="lg">
        <Link href="/#start">{t.cta}</Link>
      </Button>
    </div>
  );
}
