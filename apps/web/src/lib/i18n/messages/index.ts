import { shellMessages } from "./shell";

/** Every block of site text. The parity test walks this registry, so add each new block here. */
export const ALL_MESSAGES = {
  shell: shellMessages,
} as const;
