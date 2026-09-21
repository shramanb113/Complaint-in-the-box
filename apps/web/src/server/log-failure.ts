import "server-only";

/**
 * Logs what went wrong, never what the person wrote (ruling R12). Drizzle wraps a driver error in one
 * whose message is "Failed query: <sql> params: <the bound values>" (the whole letter, for a save).
 * So when an error has a cause we log only the cause's message (the driver's own error carries no bound
 * values) and, if the cause is not an Error, only the wrapper's name, never its message.
 */
export function logFailure(what: string, error: unknown): void {
  if (!(error instanceof Error)) {
    console.error(`${what}: unknown error`);
    return;
  }
  if (error.cause === undefined) {
    console.error(`${what}: ${error.name}: ${error.message}`);
  } else if (error.cause instanceof Error) {
    console.error(`${what}: ${error.cause.name}: ${error.cause.message}`);
  } else {
    console.error(`${what}: ${error.name}`);
  }
}
