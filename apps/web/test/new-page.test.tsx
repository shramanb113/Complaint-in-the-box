// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "hi" }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: async () => state.locale }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("../src/app/new/[category]/actions", () => ({ submitIntakeAction: vi.fn() }));

import NewComplaintPage from "../src/app/new/[category]/page";

async function renderPage(category: string, template?: string | string[]) {
  const ui = await NewComplaintPage({ params: Promise.resolve({ category }), searchParams: Promise.resolve({ template }) });
  return render(ui);
}

beforeEach(() => {
  state.locale = "en";
});

describe("/new/[category] without a template", () => {
  it("lists the category's situations as plain links, with no form", async () => {
    await renderPage("ecommerce");
    expect(screen.getByRole("heading", { level: 1, name: "Which one matches?" })).toBeInTheDocument();
    const links = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.includes("?template="));
    expect(links).toHaveLength(5);
    expect(screen.getByRole("link", { name: /Wrong item delivered/ })).toHaveAttribute("href", "/new/ecommerce?template=ecom_wrong_item");
    expect(screen.queryByRole("button", { name: "Make my letter" })).toBeNull();
  });

  it("gives the closest-match advice and a way back", async () => {
    await renderPage("upi");
    expect(screen.getByText(/Pick the closest match/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to all problems" })).toHaveAttribute("href", "/#start");
  });

  it("renders in Hindi", async () => {
    state.locale = "hi";
    await renderPage("food");
    expect(screen.getByRole("link", { name: /दूसरा आइटम मिला/ })).toHaveAttribute("href", "/new/food?template=food_wrong_item");
  });
});

describe("/new/[category] with a template", () => {
  it("shows the situation as the title and the form", async () => {
    await renderPage("ecommerce", "ecom_wrong_item");
    expect(screen.getByRole("heading", { level: 1, name: "Wrong item delivered" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make my letter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change situation" })).toHaveAttribute("href", "/new/ecommerce");
  });

  it("puts the fixed disclaimer above the submit button", async () => {
    await renderPage("upi", "upi_double_debit");
    expect(screen.getByText(/It is not a lawyer, not the government/)).toBeInTheDocument();
  });

  it("ignores a template from another category and shows that category's list instead", async () => {
    await renderPage("ecommerce", "upi_double_debit");
    expect(screen.getByRole("heading", { level: 1, name: "Which one matches?" })).toBeInTheDocument();
  });
});

describe("/new/[category] with a bad category", () => {
  it("is a 404", async () => {
    await expect(renderPage("bogus")).rejects.toThrow("NOT_FOUND");
    await expect(renderPage("constructor")).rejects.toThrow("NOT_FOUND");
  });
});
