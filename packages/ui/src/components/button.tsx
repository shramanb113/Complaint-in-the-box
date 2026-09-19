import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  [
    "inline-flex min-h-11 select-none items-center justify-center gap-2 whitespace-nowrap",
    "border-[3px] border-ink font-display font-extrabold tracking-tight",
    "transition-[transform,box-shadow,background-color] duration-[120ms] ease-out",
    "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
    "motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5",
    "motion-safe:active:translate-x-1 motion-safe:active:translate-y-1",
    "shadow-hard hover:shadow-hard-lg active:shadow-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-wa text-ink",
        accent: "bg-turmeric text-ink",
        secondary: "bg-white text-ink",
        danger: "bg-tomato text-ink",
      },
      size: {
        md: "rounded-xl px-5 py-3 text-[15px]",
        lg: "rounded-xl px-6 py-4 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
