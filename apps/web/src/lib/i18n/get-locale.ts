import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveUiLocale, type UiLocale } from "./locale";

/**
 * The language the visitor chose, or English. Reading the cookie opts the calling route into
 * dynamic rendering, which is deliberate (see the plan's ruling R2).
 */
export async function getLocale(): Promise<UiLocale> {
  const store = await cookies();
  return resolveUiLocale(store.get(LOCALE_COOKIE)?.value);
}
