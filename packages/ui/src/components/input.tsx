import * as React from "react";
import { cn } from "../lib/cn";
import { fieldBase } from "../lib/field-styles";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(fieldBase, className)} {...props} />
  )
);
Input.displayName = "Input";
