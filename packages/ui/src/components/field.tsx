import * as React from "react";
import { cn } from "../lib/cn";
import { Label } from "./label";

interface FieldChrome {
  label: string;
  hint?: string;
  error?: string;
  /** Shown after the label, for example "(optional)". */
  optionalLabel?: string;
}

/** The error line: a tomato marker plus bold ink text, so it is not communicated by colour alone. */
function ErrorLine({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-sm font-bold">
      <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-sm border-2 border-ink bg-tomato" />
      <span>{children}</span>
    </p>
  );
}

function describedBy(hintId?: string, errorId?: string): string | undefined {
  return [hintId, errorId].filter(Boolean).join(" ") || undefined;
}

export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

export interface FieldProps extends FieldChrome, Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  id: string;
  /** Receives the props that wire the control to its hint and error: spread them onto the input. */
  children: (control: FieldControlProps) => React.ReactNode;
}

/** A label, an optional hint, one control and an error line, wired together for screen readers. */
export function Field({ id, label, hint, error, optionalLabel, className, children, ...rest }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("flex flex-col", className)} {...rest}>
      <Label htmlFor={id}>
        {label}
        {optionalLabel ? <span className="ml-1.5 font-medium">{optionalLabel}</span> : null}
      </Label>
      {hint && hintId ? (
        <p id={hintId} className="-mt-0.5 mb-2 text-sm font-medium">
          {hint}
        </p>
      ) : null}
      {children({ id, "aria-describedby": describedBy(hintId, errorId), "aria-invalid": error ? true : undefined })}
      {error && errorId ? <ErrorLine id={errorId}>{error}</ErrorLine> : null}
    </div>
  );
}

export interface FieldGroupProps extends FieldChrome, Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, "children"> {
  id: string;
  children: React.ReactNode;
}

/** Like Field, for a set of related controls such as chips: a fieldset with a legend. */
export function FieldGroup({ id, label, hint, error, optionalLabel, className, children, ...rest }: FieldGroupProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset id={id} aria-describedby={describedBy(hintId, errorId)} className={cn("min-w-0 border-0 p-0", className)} {...rest}>
      <legend className="mb-1.5 block font-display text-sm font-extrabold">
        {label}
        {optionalLabel ? <span className="ml-1.5 font-medium">{optionalLabel}</span> : null}
      </legend>
      {hint && hintId ? (
        <p id={hintId} className="-mt-0.5 mb-2 text-sm font-medium">
          {hint}
        </p>
      ) : null}
      {children}
      {error && errorId ? <ErrorLine id={errorId}>{error}</ErrorLine> : null}
    </fieldset>
  );
}
