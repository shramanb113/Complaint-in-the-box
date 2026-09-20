import type { Packet } from "@nyaypatra/core";
import type { FormErrors } from "./fields";

/** What submitting the form comes back with. A saved letter is a redirect on the server, so the form only sees the rest. */
export type SubmitResult =
  | { status: "saved"; id: string }
  /** The letter was generated but could not be saved: show it anyway so the person can copy it (spec §5.4). */
  | { status: "unsaved"; packet: Packet }
  | { status: "invalid"; errors: FormErrors }
  | { status: "rate_limited" }
  | { status: "error" };

/** The form's state between submits. */
export type SubmitState = { status: "idle" } | Exclude<SubmitResult, { status: "saved" }>;
