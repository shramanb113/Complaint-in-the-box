import * as React from "react";
import { cn } from "../lib/cn";
import { fieldBase } from "../lib/field-styles";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-28 resize-y font-medium leading-snug", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
