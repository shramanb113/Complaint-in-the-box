export interface YMD {
  y: number;
  m: number; // 1-indexed
  d: number;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const HI_MONTHS = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

export function ymdFromISODate(iso: string): YMD {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** India has no DST, so a fixed +5:30 offset is always correct. */
export function nowToIstYMD(now: Date = new Date()): YMD {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

export function addDaysToYMD(ymd: YMD, days: number): YMD {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function computeDeadlineYMD(deadlineDays: number, now: Date = new Date()): YMD {
  return addDaysToYMD(nowToIstYMD(now), deadlineDays);
}

export function formatYMDEn(ymd: YMD): string {
  return `${ymd.d} ${EN_MONTHS[ymd.m - 1]} ${ymd.y}`;
}

export function formatYMDHi(ymd: YMD): string {
  return `${ymd.d} ${HI_MONTHS[ymd.m - 1]} ${ymd.y}`;
}
