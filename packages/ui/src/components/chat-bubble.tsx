import * as React from "react";
import { cn } from "../lib/cn";

export interface ChatBubbleProps {
  children: React.ReactNode;
  /** e.g. "10:42" — shown with WhatsApp-style double ticks. */
  time?: string;
  className?: string;
}

/** The generated letter shown as a sent WhatsApp message. Newlines are preserved. */
export function ChatBubble({ children, time, className }: ChatBubbleProps) {
  return (
    <div className={cn("rounded-2xl border-[2.5px] border-ink bg-chat-bg p-2.5", className)}>
      <div className="whitespace-pre-wrap rounded-xl rounded-br-sm border-2 border-ink bg-chat px-3 py-2.5 font-mono text-[13px] leading-relaxed motion-safe:animate-pop">
        {children}
      </div>
      {time ? <p className="mt-1 text-right text-[11px] font-extrabold text-[#128c7e]">✓✓ {time}</p> : null}
    </div>
  );
}
