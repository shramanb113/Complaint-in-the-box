export const SITE = { name: "Nyay Patra" } as const;

const EMAIL_SHAPE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * The contact address for the legal pages. Read from the CONTACT_EMAIL environment variable at run
 * time, so the founder chooses it at deploy and nothing is hardcoded. Undefined means "not set yet":
 * the legal pages then simply leave the contact line out.
 */
export function contactEmail(env: { CONTACT_EMAIL?: string | undefined; [key: string]: string | undefined }): string | undefined {
  const value = env.CONTACT_EMAIL?.trim();
  return value && EMAIL_SHAPE.test(value) ? value : undefined;
}
