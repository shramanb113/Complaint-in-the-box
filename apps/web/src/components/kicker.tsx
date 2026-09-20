import type { ReactNode } from "react";
import { cn } from "@nyaypatra/ui";

/** The small uppercase mono label above a section title. Grows to 14px in Hindi (Space Mono has no Devanagari). */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-mono text-xs hi:text-sm font-bold uppercase tracking-wide", className)}>{children}</p>;
}
