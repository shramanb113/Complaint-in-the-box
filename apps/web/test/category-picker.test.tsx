// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryPicker } from "../src/components/landing/category-picker";
import { CATEGORY_ORDER, templatesByCategory } from "../src/lib/catalog";
import { pickerMessages } from "../src/lib/i18n/messages/picker";

function renderPicker(locale: "en" | "hi" = "en") {
  const t = pickerMessages[locale];
  const grouped = templatesByCategory();
  return render(
    <CategoryPicker
      kicker={t.kicker}
      title={t.title}
      hint={t.hint}
      legend={t.legend}
      templatesHeading={t.templatesHeading}
      categories={CATEGORY_ORDER.map((id) => ({ id, title: t.categories[id].title, example: t.categories[id].example }))}
      templates={Object.fromEntries(
        CATEGORY_ORDER.map((id) => [id, grouped[id].map((templateId) => ({ id: templateId, label: t.templates[templateId] }))])
      ) as never}
    />
  );
}

describe("CategoryPicker", () => {
  it("shows four categories as a labelled radio group and no situations yet", () => {
    renderPicker();
    const group = screen.getByRole("radiogroup", { name: "Type of problem" });
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByText("Which one matches?")).toBeNull();
    expect(document.getElementById("start")).not.toBeNull();
  });

  it("keeps the kicker readable in Hindi (14px minimum)", () => {
    renderPicker("hi");
    expect(screen.getByText(pickerMessages.hi.kicker).className).toContain("hi:text-sm");
  });

  it("lists the situations of the chosen category, each linking to the intake route with its template", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("radio", { name: /Online shopping/ }));
    expect(screen.getByText("Which one matches?")).toBeInTheDocument();
    const wrong = screen.getByRole("link", { name: /Wrong item delivered/ });
    expect(wrong).toHaveAttribute("href", "/new/ecommerce?template=ecom_wrong_item");
    expect(screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.includes("?template="))).toHaveLength(5);
    expect(screen.queryByRole("link", { name: /None of these/ })).toBeNull();
  });

  it("swaps the list when another category is chosen", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("radio", { name: /Online shopping/ }));
    await user.click(screen.getByRole("radio", { name: /UPI payment/ }));
    expect(screen.queryByRole("link", { name: /Wrong item delivered/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Charged twice for one payment/ })).toHaveAttribute(
      "href",
      "/new/upi?template=upi_double_debit"
    );
  });

  it("announces the revealed list politely and keeps every link a 44px target", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("radio", { name: /Food delivery/ }));
    expect(screen.getByText("Which one matches?").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
    for (const link of screen.getAllByRole("link")) expect(link.className).toContain("min-h-11");
  });

  it("renders in Hindi", async () => {
    const user = userEvent.setup();
    renderPicker("hi");
    await user.click(screen.getByRole("radio", { name: /खाना डिलीवरी/ }));
    expect(screen.getByRole("link", { name: /दूसरा आइटम मिला/ })).toHaveAttribute("href", "/new/food?template=food_wrong_item");
  });
});
