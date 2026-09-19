import * as React from "react";
import { cn } from "../lib/cn";

export interface DeadlineTagProps {
  tone?: "urgent" | "ready";
  children: React.ReactNode;
  className?: string;
}

export function DeadlineTag({ tone = "urgent", children, className }: DeadlineTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border-2 border-ink px-2 py-0.5 text-xs font-extrabold shadow-hard-sm",
        tone === "urgent" ? "bg-tomato text-ink" : "bg-turmeric text-ink",
        className
      )}
    >
      {children}
    </span>
  );
}
