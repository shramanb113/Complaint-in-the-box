// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CATEGORY_ICON } from "../src/components/icons";
import { CATEGORY_ORDER } from "../src/lib/catalog";

describe("category icons", () => {
  it("has one decorative icon for every category", () => {
    expect(Object.keys(CATEGORY_ICON).sort()).toEqual([...CATEGORY_ORDER].sort());
  });

  it("renders each as a hidden, text-free SVG (no emoji, no accessible name of its own)", () => {
    for (const Icon of Object.values(CATEGORY_ICON)) {
      const { container, unmount } = render(<Icon />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg?.textContent).toBe("");
      unmount();
    }
  });
});
