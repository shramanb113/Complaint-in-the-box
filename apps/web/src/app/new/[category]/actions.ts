"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TemplateIdSchema } from "@nyaypatra/core";
import { FIELD_NAMES, type RawIntake } from "@/lib/intake/fields";
import type { SubmitState } from "@/lib/intake/result";
import { clientIp } from "@/server/ip";
import { getServices } from "@/server/services";
import { submitIntake } from "@/server/submit-intake";

/**
 * The intake form's Server Action. It copies only the known field names out of the form data (so a
 * hand-made `utr` or `category` field is ignored), derives everything else itself, and redirects to
 * the saved letter. It returns a state only when there is something to show on the form.
 */
export async function submitIntakeAction(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const template = TemplateIdSchema.safeParse(formData.get("templateId"));
  if (!template.success) return { status: "error" };

  const raw: Partial<RawIntake> = {};
  for (const name of FIELD_NAMES) {
    const value = formData.get(name);
    if (typeof value === "string") raw[name] = value;
  }

  const result = await submitIntake(getServices(), {
    templateId: template.data,
    raw,
    ip: clientIp(await headers()),
    now: new Date(),
  });
  // redirect() throws, so it must stay outside any try/catch.
  if (result.status === "saved") redirect(`/packet/${result.id}`);
  return result;
}
