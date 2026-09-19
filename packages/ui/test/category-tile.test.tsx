import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryTile } from "../src/components/category-tile";
import { fontSizePx } from "./font-size";

function renderTile(overrides: Partial<React.ComponentProps<typeof CategoryTile>> = {}) {
  const onSelect = vi.fn();
  render(
    <div role="radiogroup" aria-label="Type of problem">
      <CategoryTile
        name="category"
        value="ecommerce"
        title="Online shopping"
        description="Wrong, damaged or missing orders"
        icon={<svg data-testid="icon" />}
        checked={false}
        onSelect={onSelect}
        {...overrides}
      />
    </div>
  );
  return { onSelect };
}

describe("CategoryTile", () => {
  it("is a radio whose name is its title and description", () => {
    renderTile();
    const radio = screen.getByRole("radio", { name: /Online shopping.*Wrong, damaged or missing orders/ });
    expect(radio).toHaveAttribute("name", "category");
    expect(radio).toHaveAttribute("value", "ecommerce");
  });

  it("reflects the checked prop", () => {
    renderTile({ checked: true });
    expect(screen.getByRole("radio")).toBeChecked();
  });

  it("calls onSelect with its value when chosen", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderTile();
    await user.click(screen.getByRole("radio"));
    expect(onSelect).toHaveBeenCalledWith("ecommerce");
  });

  it("hides the icon from assistive tech and keeps the tile at least 44px tall", () => {
    renderTile();
    expect(screen.getByTestId("icon").closest("[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByText("Online shopping").parentElement?.className).toContain("min-h-11");
  });

  it("shows a check badge for the selected tile so selection is not colour-only", () => {
    renderTile({ checked: true });
    const badge = screen.getByText("✓");
    expect(badge).toHaveAttribute("aria-hidden", "true");
    expect(badge.className).toContain("peer-checked:flex");
  });

  it("uses a pastel tone, peach by default", () => {
    const { rerender } = render(
      <CategoryTile name="c" value="v" title="T" description="D" icon={null} checked={false} onSelect={() => {}} />
    );
    expect(screen.getByText("T").parentElement?.className).toContain("bg-peach");
    rerender(
      <CategoryTile name="c" value="v" title="T" description="D" icon={null} checked={false} onSelect={() => {}} tone="mint" />
    );
    expect(screen.getByText("T").parentElement?.className).toContain("bg-mint");
  });

  it("keeps the description at 14px or larger so Hindi stays readable", () => {
    renderTile({ description: "ग़लत, टूटे या न पहुँचे ऑर्डर" });
    expect(fontSizePx(screen.getByText(/ग़लत/).className)).toBeGreaterThanOrEqual(14);
  });

  it("shows the green focus ring on the tile when the hidden radio has keyboard focus", () => {
    renderTile();
    expect(screen.getByText("Online shopping").parentElement?.className).toContain("peer-focus-visible:outline-wa");
  });
});
