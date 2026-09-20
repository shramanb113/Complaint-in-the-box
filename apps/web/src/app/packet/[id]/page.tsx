import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatYMDEn, formatYMDHi, nowToIstYMD } from "@nyaypatra/core";
import { PacketPlain } from "@/components/packet/packet-plain";
import { fill } from "@/lib/i18n/define";
import { getLocale } from "@/lib/i18n/get-locale";
import { packetMessages } from "@/lib/i18n/messages/packet";
import { getServices } from "@/server/services";
import { packetExpiresAt } from "@/server/store/types";

/** A ULID: 26 Crockford base32 characters. Anything else is not one of our links. */
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: packetMessages[await getLocale()].title, robots: { index: false, follow: false } };
}

/**
 * Stopgap letter page (Milestone 3): the whole letter as plain text. Milestone 4 replaces this file
 * with the tabbed page; the id check, the store read and the not-found behaviour stay.
 */
export default async function PacketPage({ params }: Props) {
  const { id } = await params;
  if (!ULID.test(id)) notFound();
  const packet = await getServices().store.get(id);
  if (!packet) notFound();

  const locale = await getLocale();
  const t = packetMessages[locale];
  const format = locale === "hi" ? formatYMDHi : formatYMDEn;
  const expiresLine = fill(t.expires, { date: format(nowToIstYMD(packetExpiresAt(packet))) });
  return <PacketPlain packet={packet} locale={locale} strings={t} expiresLine={expiresLine} />;
}
