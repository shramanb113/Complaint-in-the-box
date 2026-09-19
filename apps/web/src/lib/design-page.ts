/** The internal /design gallery is visible outside production, or in production when explicitly switched on. */
export function isDesignPageEnabled(env: { NODE_ENV?: string; NEXT_PUBLIC_SHOW_DESIGN?: string }): boolean {
  return env.NODE_ENV !== "production" || env.NEXT_PUBLIC_SHOW_DESIGN === "1";
}
