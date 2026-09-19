"use server";

import { cookies } from "next/headers";
import { isUiLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS } from "./locale";

/** Form action behind the language toggle. Ignores anything that is not a supported language. */
export async function setLocale(formData: FormData): Promise<void> {
  const choice = formData.get("locale");
  if (!isUiLocale(choice)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, choice, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
