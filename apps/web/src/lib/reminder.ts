import { addDaysToYMD, ymdToIsoDate, type YMD } from "@nyaypatra/core";

export interface ReminderInput {
  /** Stable per letter, so re-importing the file updates the same calendar entry instead of adding a copy. */
  uid: string;
  deadline: YMD;
  title: string;
  description: string;
  /** Used for the file's DTSTAMP; passed in so the output is deterministic. */
  now: Date;
}

const compact = (ymd: YMD) => ymdToIsoDate(ymd).replaceAll("-", "");

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** RFC 5545 asks for lines of at most 75 octets; continuation lines start with one space. Never splits a UTF-8 character. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      parts.push(current);
      current = char;
      size = bytes;
    } else {
      current += char;
      size += bytes;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** An all-day calendar entry on the deadline day, with a 9 AM alert. Works in Google, Apple and Outlook calendars. */
export function buildReminderIcs({ uid, deadline, title, description, now }: ReminderInput): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nyay Patra//Reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@nyaypatra`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(deadline)}`,
    `DTEND;VALUE=DATE:${compact(addDaysToYMD(deadline, 1))}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(title)}`,
    "TRIGGER;RELATED=START:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
