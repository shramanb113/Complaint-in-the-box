import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, FieldGroup } from "../src/components/field";
import { MoneyField } from "../src/components/money-field";
import { DateField } from "../src/components/date-field";
import { Input } from "../src/components/input";
import { fontSizePx } from "./font-size";

describe("Field", () => {
  it("links the label to the control", () => {
    render(<Field id="city" label="Your city">{(control) => <Input {...control} />}</Field>);
    expect(screen.getByLabelText("Your city")).toBe(document.getElementById("city"));
  });

  it("describes the control by its hint and then its error, and marks it invalid", () => {
    render(
      <Field id="amt" label="Amount" hint="Whole rupees" error="Use numbers only">
        {(control) => <Input {...control} />}
      </Field>
    );
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("aria-describedby", "amt-hint amt-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById("amt-hint")).toHaveTextContent("Whole rupees");
    expect(document.getElementById("amt-error")).toHaveTextContent("Use numbers only");
  });

  it("adds no description and no invalid flag when there is nothing to say", () => {
    render(<Field id="x" label="Plain">{(control) => <Input {...control} />}</Field>);
    const input = screen.getByLabelText("Plain");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("shows only the error when there is no hint", () => {
    render(<Field id="y" label="Only error" error="Bad">{(control) => <Input {...control} />}</Field>);
    expect(screen.getByLabelText("Only error")).toHaveAttribute("aria-describedby", "y-error");
  });

  it("shows an optional marker beside the label", () => {
    render(<Field id="o" label="Order ID" optionalLabel="(optional)">{(control) => <Input {...control} />}</Field>);
    expect(screen.getByLabelText(/Order ID/)).toBeInTheDocument();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("keeps the hint and the error at 14px or larger so Hindi stays readable", () => {
    render(
      <Field id="h" label="शहर" hint="पत्र के अंत में छपेगा।" error="यह जानकारी ज़रूरी है।">
        {(control) => <Input {...control} />}
      </Field>
    );
    for (const text of ["पत्र के अंत में छपेगा।", "यह जानकारी ज़रूरी है।"]) {
      const line = screen.getByText(text).closest("p");
      expect(line).not.toBeNull();
      expect(fontSizePx(line?.className ?? "")).toBeGreaterThanOrEqual(14);
    }
  });

  it("forwards extra attributes and a class to the wrapper", () => {
    const { container } = render(
      <Field id="z" label="Z" className="max-w-40" data-field="z">
        {(control) => <Input {...control} />}
      </Field>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-field", "z");
    expect(wrapper.className).toContain("max-w-40");
  });
});

describe("FieldGroup", () => {
  it("is a labelled group with its hint and error", () => {
    render(
      <FieldGroup id="platform" label="Where did you order?" hint="Pick one" error="This is needed.">
        <label>
          <input type="radio" name="p" /> Flipkart
        </label>
      </FieldGroup>
    );
    const group = screen.getByRole("group", { name: "Where did you order?" });
    expect(group).toHaveAttribute("aria-describedby", "platform-hint platform-error");
    expect(group).toHaveTextContent("This is needed.");
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });
});

describe("MoneyField", () => {
  it("shows a rupee sign, asks for the numeric keypad and accepts typing", async () => {
    const user = userEvent.setup();
    render(<MoneyField aria-label="Amount" />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByText("₹")).toHaveAttribute("aria-hidden", "true");
    await user.type(input, "2,499");
    expect(input).toHaveValue("2,499");
  });

  it("lets a caller override the keypad and merges a class", () => {
    render(<MoneyField aria-label="Amount" inputMode="decimal" className="max-w-40" />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input.className).toContain("max-w-40");
  });
});

describe("DateField", () => {
  it("is a native date input with min and max", () => {
    render(<DateField aria-label="Date" min="2016-01-01" max="2026-09-20" />);
    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("type", "date");
    expect(input).toHaveAttribute("min", "2016-01-01");
    expect(input).toHaveAttribute("max", "2026-09-20");
  });
});
