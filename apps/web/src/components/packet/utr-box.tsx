"use client";

import { useRef } from "react";
import { Field, Input } from "@nyaypatra/ui";
import { normalizeUtr } from "@nyaypatra/core";
import { track } from "@/lib/analytics/track";
import type { PacketStrings } from "@/lib/i18n/messages/packet";

export interface UtrBoxProps {
  value: string;
  onChange: (value: string) => void;
  strings: PacketStrings["utr"];
}

/** Shown only for UPI templates (spec D3, §5.6). The value lives in this component's parent's state only. */
export function UtrBox({ value, onChange, strings: t }: UtrBoxProps) {
  const trackedRef = useRef(false);
  const invalid = value.trim().length > 0 && normalizeUtr(value) === undefined;
  return (
    <div className="rounded-card border-[3px] border-ink bg-sky p-4 shadow-hard">
      <Field id="utr" label={t.label} hint={t.hint} error={invalid ? t.invalid : undefined}>
        {(control) => (
          <Input
            {...control}
            value={value}
            placeholder={t.placeholder}
            autoComplete="off"
            inputMode="numeric"
            onChange={(event) => {
              const next = event.target.value;
              onChange(next);
              if (next.trim().length > 0 && !trackedRef.current) {
                trackedRef.current = true;
                track("utr_entered", { entered: true });
              }
            }}
          />
        )}
      </Field>
    </div>
  );
}
