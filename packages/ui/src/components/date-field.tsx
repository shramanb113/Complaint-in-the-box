import * as React from "react";
import { cn } from "../lib/cn";
import { Input } from "./input";

/** A native date picker (the best one on phones). Give it min and max as YYYY-MM-DD. */
export const DateField = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => <Input ref={ref} type="date" className={cn("min-w-0", className)} {...props} />
);
DateField.displayName = "DateField";
