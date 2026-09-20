import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { setLocale } from "../src/lib/i18n/actions";
import { getLocale } from "../src/lib/i18n/get-locale";

function formWith(value?: string): FormData {
  const data = new FormData();
  if (value !== undefined) data.set("locale", value);
  return data;
}

describe("setLocale", () => {
  const set = vi.fn();

  beforeEach(() => {
    set.mockReset();
    vi.mocked(cookies).mockResolvedValue({ set } as never);
  });

  it("stores the chosen language in a year-long, lax, http-only cookie", async () => {
    await setLocale(formWith("hi"));
    expect(set).toHaveBeenCalledWith("np_lang", "hi", {
      path: "/",
      maxAge: 31_536_000,
      sameSite: "lax",
      httpOnly: true,
      secure: false,
    });
  });

  it("ignores anything that is not a supported language", async () => {
    await setLocale(formWith("fr"));
    await setLocale(formWith(""));
    await setLocale(formWith());
    expect(set).not.toHaveBeenCalled();
  });
});

/** A cookie store that only knows np_lang: reading any other name gets undefined, so a wrong name fails the test. */
function cookieNamed(value: string | undefined) {
  return (name: string) => (name === "np_lang" && value !== undefined ? { name, value } : undefined);
}

describe("getLocale", () => {
  it("reads the cookie", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: cookieNamed("hi") } as never);
    expect(await getLocale()).toBe("hi");
  });

  it("falls back to English when the cookie is missing or junk", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: cookieNamed(undefined) } as never);
    expect(await getLocale()).toBe("en");
    vi.mocked(cookies).mockResolvedValue({ get: cookieNamed("zz") } as never);
    expect(await getLocale()).toBe("en");
  });
});
