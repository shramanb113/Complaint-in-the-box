"use client";

import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { copyToClipboard } from "../lib/clipboard";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  text: string;
  idleLabel: string;
  doneLabel: string;
  resetAfterMs?: number;
  onCopied?: () => void;
  onFailed?: () => void;
}

export function CopyButton({
  text,
  idleLabel,
  doneLabel,
  resetAfterMs = 2000,
  onCopied,
  onFailed,
  variant = "primary",
  ...props
}: CopyButtonProps) {
  const [done, setDone] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  async function handleClick() {
    const ok = await copyToClipboard(text);
    if (!ok) {
      onFailed?.();
      return;
    }
    setDone(true);
    onCopied?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), resetAfterMs);
  }

  return (
    <Button variant={done ? "accent" : variant} onClick={handleClick} aria-live="polite" {...props}>
      <span key={done ? "done" : "idle"} className={done ? "motion-safe:animate-pop" : undefined}>
        {done ? doneLabel : idleLabel}
      </span>
    </Button>
  );
}
