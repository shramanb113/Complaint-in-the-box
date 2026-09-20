// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InMemoryPacketStore } from "../src/server/store/memory";
import { SAVED_AT, samplePacket } from "./helpers/packet";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "hi", services: undefined as unknown }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: async () => state.locale }));
vi.mock("@/server/services", () => ({ getServices: () => state.services }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import PacketPage from "../src/app/packet/[id]/page";
import PacketNotFound from "../src/app/packet/[id]/not-found";

let store: InMemoryPacketStore;
const ID = "01K5ZZZZZZZZZZZZZZZZZZZZZZ";

beforeEach(async () => {
  state.locale = "en";
  store = new InMemoryPacketStore();
  state.services = { store };
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(SAVED_AT.getTime() + 60_000));
  await store.save(samplePacket(ID));
});

afterEach(() => vi.useRealTimers());

const open = async (id: string) => render(await PacketPage({ params: Promise.resolve({ id }) }));

describe("/packet/[id]", () => {
  it("shows a saved letter with the date its link expires", async () => {
    await open(ID);
    expect(screen.getByRole("heading", { name: "Your complaint is ready" })).toBeInTheDocument();
    expect(screen.getByText("This link works until 27 Sep 2026. Copy what you need before then.")).toBeInTheDocument();
  });

  it("is a 404 for an id that is not a ULID, without asking the store", async () => {
    const get = vi.spyOn(store, "get");
    await expect(open("not-a-ulid")).rejects.toThrow("NOT_FOUND");
    await expect(open("../../etc/passwd")).rejects.toThrow("NOT_FOUND");
    expect(get).not.toHaveBeenCalled();
  });

  it("is a 404 for a well-formed id nobody saved", async () => {
    await expect(open("01K5AAAAAAAAAAAAAAAAAAAAAA")).rejects.toThrow("NOT_FOUND");
  });

  it("is a 404 once the link has expired", async () => {
    vi.setSystemTime(new Date(SAVED_AT.getTime() + 8 * 86_400_000));
    await expect(open(ID)).rejects.toThrow("NOT_FOUND");
  });

  it("renders the letter in Hindi when the site is Hindi", async () => {
    state.locale = "hi";
    await open(ID);
    expect(screen.getByRole("heading", { name: "आपकी शिकायत तैयार है" })).toBeInTheDocument();
  });
});

describe("the expired page", () => {
  it("explains that letter links last 7 days and offers a fresh start", async () => {
    render(await PacketNotFound());
    expect(screen.getByRole("heading", { name: "This letter link has expired" })).toBeInTheDocument();
    expect(screen.getByText(/work for 7 days/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Make a new letter" })).toHaveAttribute("href", "/#start");
  });
});
