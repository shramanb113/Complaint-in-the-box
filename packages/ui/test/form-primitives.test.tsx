import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../src/components/input";
import { Textarea } from "../src/components/textarea";
import { Label } from "../src/components/label";
import { ChipGroup } from "../src/components/chip-group";
import { fontSizePx } from "./font-size";

describe("Label + Input", () => {
  it("associates the label with the input and accepts typing", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="amount">Amount paid</Label>
        <Input id="amount" placeholder="2,499" />
      </>
    );
    const input = screen.getByLabelText("Amount paid");
    await user.type(input, "2499");
    expect(input).toHaveValue("2499");
    expect(input.className).toContain("border-ink");
    expect(input.className).toContain("min-h-12");
  });

  it("sets the label at 14px or larger so Hindi labels stay readable", () => {
    render(<Label htmlFor="city">शहर</Label>);
    expect(fontSizePx(screen.getByText("शहर").className)).toBeGreaterThanOrEqual(14);
  });

  it("switches to the tomato error style when aria-invalid", () => {
    render(<Input aria-label="Order ID" aria-invalid="true" />);
    expect(screen.getByLabelText("Order ID").className).toContain("aria-[invalid=true]:border-tomato");
    expect(screen.getByLabelText("Order ID")).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards a custom className", () => {
    render(<Input aria-label="City" className="max-w-40" />);
    expect(screen.getByLabelText("City").className).toContain("max-w-40");
  });
});

describe("Textarea", () => {
  it("renders a textarea with the field styles and accepts typing", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="What happened?" />);
    const field = screen.getByLabelText("What happened?");
    await user.type(field, "Wrong item delivered");
    expect(field).toHaveValue("Wrong item delivered");
    expect(field.className).toContain("border-ink");
  });
});

describe("ChipGroup", () => {
  const options = [
    { value: "flipkart", label: "Flipkart" },
    { value: "amazon", label: "Amazon" },
    { value: "other", label: "Other…" },
  ];

  it("is a named radiogroup with one radio per option and the current value checked", () => {
    render(
      <ChipGroup name="platform" legend="Where did you order?" value="amazon" onValueChange={() => {}} options={options} />
    );
    expect(screen.getByRole("radiogroup", { name: "Where did you order?" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Amazon" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Flipkart" })).not.toBeChecked();
  });

  it("calls onValueChange with the clicked option's value", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ChipGroup name="platform" legend="Where did you order?" value="amazon" onValueChange={onValueChange} options={options} />
    );
    await user.click(screen.getByText("Flipkart"));
    expect(onValueChange).toHaveBeenCalledWith("flipkart");
  });

  it("gives every chip a 44px minimum tap target", () => {
    render(
      <ChipGroup name="platform" legend="Where did you order?" value={undefined} onValueChange={() => {}} options={options} />
    );
    expect(screen.getByText("Flipkart").className).toContain("min-h-11");
  });
});
