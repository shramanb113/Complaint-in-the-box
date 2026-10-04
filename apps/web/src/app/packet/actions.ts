"use server";

import { redirect } from "next/navigation";
import { logFailure } from "@/server/log-failure";
import { getServices } from "@/server/services";

/** A ULID: 26 Crockford base32 characters. Anything else is not one of our links. */
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/**
 * Form action behind "Delete this letter now". The private link is the only credential this
 * product has, so whoever holds the id may delete the letter, the same as they may read it.
 */
export async function deletePacket(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !ULID.test(id)) redirect("/");
  try {
    await getServices().store.delete(id);
  } catch (error) {
    logFailure("could not delete the letter", error);
    throw new Error("could not delete the letter");
  }
  redirect("/packet-deleted");
}
