import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatYMDEn, formatYMDHi, nowToIstYMD } from "@nyaypatra/core";
import { deletePacket } from "@/app/packet/actions";
import { PacketView } from "@/components/packet/packet-view";
import { fill } from "@/lib/i18n/define";
import { getLocale } from "@/lib/i18n/get-locale";
import { packetMessages } from "@/lib/i18n/messages/packet";
import { contactEmail } from "@/lib/site";
import { logFailure } from "@/server/log-failure";
import { getServices } from "@/server/services";
import { packetExpiresAt } from "@/server/store/types";

/** A ULID: 26 Crockford base32 characters. Anything else is not one of our links. */
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: packetMessages[await getLocale()].title, robots: { index: false, follow: false } };
}

export default async function PacketPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!ULID.test(id)) notFound();
  let packet;
  try {
    packet = await getServices().store.get(id);
  } catch (error) {
    logFailure("could not load the letter", error);
    throw new Error("could not load the letter");
  }
  if (!packet) notFound();

  const { new: isNewParam } = await searchParams;
  const locale = await getLocale();
  const t = packetMessages[locale];
  const format = locale === "hi" ? formatYMDHi : formatYMDEn;
  const expiresLine = fill(t.expires, { date: format(nowToIstYMD(packetExpiresAt(packet))) });
  return <PacketView packet={packet} locale={locale} strings={t} expiresLine={expiresLine} isNew={isNewParam === "1"} deleteAction={deletePacket} contactEmail={contactEmail(process.env)} />;
}
