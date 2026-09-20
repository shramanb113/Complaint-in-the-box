import * as React from "react";
import { cn } from "../lib/cn";
import { Input } from "./input";

/** An amount in rupees: a "₹" prefix and the numeric keypad. Parsing is the caller's job (whole rupees, any Indian format). */
export const MoneyField = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-display text-lg font-extrabold"
      >
        ₹
      </span>
      <Input ref={ref} inputMode="numeric" autoComplete="off" className={cn("pl-9", className)} {...props} />
    </div>
  )
);
MoneyField.displayName = "MoneyField";
