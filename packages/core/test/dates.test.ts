import { describe, it, expect } from "vitest";
import {
  ymdFromISODate,
  nowToIstYMD,
  addDaysToYMD,
  computeDeadlineYMD,
  formatYMDEn,
  formatYMDHi,
} from "../src/dates";

describe("dates", () => {
  it("parses an ISO date into a YMD", () => {
    expect(ymdFromISODate("2026-09-10")).toEqual({ y: 2026, m: 9, d: 10 });
  });

  it("formats a YMD in English", () => {
    expect(formatYMDEn({ y: 2026, m: 9, d: 10 })).toBe("10 Sep 2026");
  });

  it("formats a YMD in Hindi", () => {
    expect(formatYMDHi({ y: 2026, m: 9, d: 10 })).toBe("10 सितंबर 2026");
  });

  it("adds days across a month boundary", () => {
    expect(addDaysToYMD({ y: 2026, m: 9, d: 28 }, 5)).toEqual({ y: 2026, m: 10, d: 3 });
  });

  it("reads the IST calendar date from a UTC instant near the IST midnight boundary", () => {
    // 2026-09-15T19:00:00Z = 2026-09-16T00:30 IST — already the next day in IST
    const now = new Date("2026-09-15T19:00:00Z");
    expect(nowToIstYMD(now)).toEqual({ y: 2026, m: 9, d: 16 });
  });

  it("computes a deadline as now + deadlineDays in IST, not paidOn + deadlineDays", () => {
    const now = new Date("2026-09-15T12:00:00Z"); // 2026-09-15 17:30 IST
    expect(computeDeadlineYMD(7, now)).toEqual({ y: 2026, m: 9, d: 22 });
    expect(computeDeadlineYMD(2, now)).toEqual({ y: 2026, m: 9, d: 17 });
  });
});
