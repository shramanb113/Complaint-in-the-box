import { afterEach, describe, expect, it, vi } from "vitest";
import { logFailure } from "../src/server/log-failure";

afterEach(() => vi.restoreAllMocks());

describe("logFailure", () => {
  it("logs only the cause's name and message when the wrapper's cause is an Error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const cause = new Error("connection refused");
    cause.name = "AggregateError";
    logFailure("could not save the letter", new Error("Failed query: INSERT ... params: [secret]", { cause }));
    expect(spy).toHaveBeenCalledWith("could not save the letter: AggregateError: connection refused");
  });

  it("logs only the wrapper's name when the cause is not an Error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapper = new Error("Failed query: INSERT ... params: [secret]", { cause: "ECONNRESET" });
    logFailure("could not save the letter", wrapper);
    expect(spy).toHaveBeenCalledWith("could not save the letter: Error");
  });

  it("logs only 'unknown error' when the thrown value is not an Error at all", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logFailure("could not save the letter", "a string, not an Error");
    expect(spy).toHaveBeenCalledWith("could not save the letter: unknown error");
  });

  it("logs name and message when there is no cause", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logFailure("could not save the letter", new TypeError("bad input"));
    expect(spy).toHaveBeenCalledWith("could not save the letter: TypeError: bad input");
  });
});
