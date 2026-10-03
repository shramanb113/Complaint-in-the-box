import { shellMessages } from "./shell";
import { pickerMessages } from "./picker";
import { landingMessages } from "./landing";
import { howItWorksMessages } from "./how-it-works";
import { intakeMessages } from "./intake";
import { packetMessages } from "./packet";
import { filingMessages } from "./filing";

/** Every block of site text. The parity test walks this registry, so add each new block here. */
export const ALL_MESSAGES = {
  shell: shellMessages,
  picker: pickerMessages,
  landing: landingMessages,
  howItWorks: howItWorksMessages,
  intake: intakeMessages,
  packet: packetMessages,
  filing: filingMessages,
} as const;
