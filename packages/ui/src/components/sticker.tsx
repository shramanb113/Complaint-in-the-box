import * as React from "react";
import { cn } from "../lib/cn";

export interface StickerProps {
  children: React.ReactNode;
  /** Resting rotation in degrees. */
  tilt?: number;
  className?: string;
}

export function Sticker({ children, tilt = 12, className }: StickerProps) {
  return (
    <div
      className={cn(
        "inline-flex size-24 items-center justify-center rounded-full border-[3px] border-ink bg-tomato px-2 text-center",
        "font-display text-sm font-extrabold leading-none text-white shadow-hard motion-safe:animate-wobble",
        className
      )}
      style={{ transform: `rotate(${tilt}deg)`, ["--tilt" as string]: `${tilt}deg` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
