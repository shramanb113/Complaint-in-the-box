import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../src/components/button";

describe("Button", () => {
  it("renders a type=button button with the primary Poster Pop style by default", () => {
    render(<Button>Make my letter</Button>);
    const button = screen.getByRole("button", { name: "Make my letter" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-wa");
    expect(button.className).toContain("border-ink");
    expect(button.className).toContain("shadow-hard");
  });

  it("uses the accent variant instead of primary when asked", () => {
    render(<Button variant="accent">Copied</Button>);
    const button = screen.getByRole("button", { name: "Copied" });
    expect(button.className).toContain("bg-turmeric");
    expect(button.className).not.toContain("bg-wa");
  });

  it("puts ink text on the tomato danger variant (white on tomato is only ~3.1:1, ink is ~6.1:1)", () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-tomato");
    expect(button.className).toContain("text-ink");
    expect(button.className).not.toContain("text-white");
  });

  it("meets the 44px tap target in every size", () => {
    render(
      <>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
      </>
    );
    expect(screen.getByRole("button", { name: "Medium" }).className).toContain("min-h-11");
    expect(screen.getByRole("button", { name: "Large" }).className).toContain("min-h-11");
  });

  it("only lifts and presses when not disabled, so a disabled button does not animate", () => {
    render(<Button>Lift</Button>);
    const tokens = screen.getByRole("button", { name: "Lift" }).className.split(/\s+/);
    // not-disabled: (rather than enabled:) so a link rendered with asChild still lifts.
    const moving = tokens.filter((t) => /(^|:)(hover|active):(-?translate|shadow)/.test(t));
    expect(moving.length).toBeGreaterThan(0);
    for (const token of moving) expect(token).toContain("not-disabled:");
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders its child element instead of a button with asChild", () => {
    render(
      <Button asChild>
        <a href="/new/ecommerce">Start</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Start" });
    expect(link).toHaveAttribute("href", "/new/ecommerce");
    expect(link.className).toContain("border-ink");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("merges a custom className without dropping the base styles", () => {
    render(<Button className="w-full">Wide</Button>);
    const button = screen.getByRole("button", { name: "Wide" });
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("border-ink");
  });
});
