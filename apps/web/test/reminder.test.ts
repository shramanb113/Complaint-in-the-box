import { describe, it, expect } from "vitest";
import { buildReminderIcs } from "../src/lib/reminder";

const base = {
  uid: "01J0000000000000000000000A",
  deadline: { y: 2026, m: 12, d: 31 },
  title: "Reply deadline, Zepto",
  description: "Line one\nStep 2; then, step 3",
  now: new Date("2026-10-04T09:30:00.123Z"),
};

describe("buildReminderIcs", () => {
  it("makes an all-day entry on the deadline day that ends the next day, across a year boundary", () => {
    const ics = buildReminderIcs(base);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101\r\n");
    expect(ics).toContain("DTSTAMP:20261004T093000Z\r\n");
    expect(ics).toContain("UID:01J0000000000000000000000A@nyaypatra\r\n");
  });

  it("escapes commas, semicolons and newlines in text", () => {
    const ics = buildReminderIcs(base);
    expect(ics).toContain("SUMMARY:Reply deadline\\, Zepto");
    expect(ics).toContain("DESCRIPTION:Line one\\nStep 2\\; then\\, step 3");
  });

  it("alerts at 9 AM and uses CRLF line endings", () => {
    const ics = buildReminderIcs(base);
    expect(ics).toContain("TRIGGER;RELATED=START:PT9H");
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("folds long Hindi lines to 75 bytes without splitting a character", () => {
    const ics = buildReminderIcs({ ...base, description: "जवाब की आख़िरी तारीख़ आज है। ".repeat(12) });
    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n")) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("जवाब की आख़िरी तारीख़ आज है।");
    expect(unfolded).not.toContain("\uFFFD");
  });
});
