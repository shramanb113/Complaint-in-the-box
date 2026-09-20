import { shellMessages } from "./shell";
import { pickerMessages } from "./picker";
import { newStubMessages } from "./new-stub";

/** Every block of site text. The parity test walks this registry, so add each new block here. */
export const ALL_MESSAGES = {
  shell: shellMessages,
  picker: pickerMessages,
  newStub: newStubMessages,
} as const;
