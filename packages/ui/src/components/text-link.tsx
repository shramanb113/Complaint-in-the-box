import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const textLinkVariants = cva(
  "inline-flex min-h-11 items-center font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric",
  {
    variants: {
      size: { base: "", sm: "text-sm" },
      display: { true: "font-display", false: "" },
    },
    defaultVariants: { size: "base", display: false },
  }
);

export type TextLinkVariants = VariantProps<typeof textLinkVariants>;

export interface TextLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, TextLinkVariants {}

/** A real `<a>` styled like the site's inline text links. Pages using `next/link` call `textLinkVariants()` directly. */
export const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(({ className, size, display, ...props }, ref) => (
  <a ref={ref} className={cn(textLinkVariants({ size, display }), className)} {...props} />
));
TextLink.displayName = "TextLink";
