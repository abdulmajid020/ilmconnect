/**
 * AlAdhan Prayer Times API Integration
 * https://aladhan.com/prayer-times-api
 *
 * Endpoint: GET https://api.aladhan.com/v1/timingsByAddress/{date}
 * - date format: DD-MM-YYYY
 * - address: "Accra, Ghana"
 * - method: 1 (University of Islamic Sciences, Karachi) — widely used in West Africa
 */

export interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface AladhanHijriDate {
  date: string;        // e.g. "01-07-1446"
  day: string;         // e.g. "1"
  month: { number: number; en: string; ar: string };
  year: string;        // e.g. "1446"
  weekday: { en: string; ar: string };
  holidays: string[];
}

export interface AladhanDate {
  readable: string;         // e.g. "10 Nov 2026"
  timestamp: string;
  hijri: AladhanHijriDate;
  gregorian: {
    date: string;
    day: string;
    weekday: { en: string };
    month: { number: number; en: string };
    year: string;
  };
}

export interface AladhanData {
  timings: AladhanTimings;
  date: AladhanDate;
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: { id: number; name: string };
  };
}

export interface AladhanResponse {
  code: number;
  status: string;
  data: AladhanData;
}

/** Convert 24-hr "HH:MM" string to 12-hr "HH:MM AM/PM" */
export function to12Hr(time24: string): string {
  // The API sometimes returns "HH:MM (UTC)" – strip annotation
  const clean = time24.split(' ')[0];
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
}

/** Format today's date as DD-MM-YYYY for the AlAdhan endpoint */
export function todayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Fetch today's prayer times for Accra, Ghana.
 * Method 1 = University of Islamic Sciences, Karachi (MWL variant common in Africa).
 * Falls back gracefully on network error.
 */
export async function fetchPrayerTimes(): Promise<AladhanData | null> {
  const date = todayFormatted();
  // method=1 (Karachi), school=0 (Standard/Shafi)
  const url =
    `https://api.aladhan.com/v1/timingsByAddress/${date}` +
    `?address=Accra%2C%20Ghana&method=1&school=0`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: AladhanResponse = await res.json();
    if (json.code === 200 && json.data) return json.data;
    return null;
  } catch {
    return null;
  }
}

/** Prayer display names and static metadata */
export const PRAYER_META = [
  { key: 'Fajr',    rakah: '2 Rakah' },
  { key: 'Dhuhr',   rakah: '4 Rakah' },
  { key: 'Asr',     rakah: '4 Rakah' },
  { key: 'Maghrib', rakah: '3 Rakah' },
  { key: 'Isha',    rakah: '4 Rakah' },
] as const;

export type PrayerKey = typeof PRAYER_META[number]['key'];

/**
 * Determine which prayer is "next" based on current local time.
 * Returns the key of the next prayer, or null if past Isha.
 */
export function getNextPrayer(timings: AladhanTimings): PrayerKey | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const { key } of PRAYER_META) {
    const raw = timings[key as keyof AladhanTimings];
    const clean = raw.split(' ')[0]; // strip " (UTC)" if present
    const [hStr, mStr] = clean.split(':');
    const prayerMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    if (prayerMinutes > nowMinutes) return key as PrayerKey;
  }
  // Past Isha – next prayer is Fajr tomorrow
  return 'Fajr';
}

/**
 * Calculate time remaining until a given prayer time (HH:MM 24hr string).
 * Returns { hours, minutes, seconds } remaining.
 */
export function timeUntilPrayer(time24: string): { h: number; m: number; s: number } {
  const clean = time24.split(' ')[0];
  const [hStr, mStr] = clean.split(':');
  const now = new Date();

  const target = new Date(now);
  target.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);

  // If prayer already passed today, it's tomorrow's Fajr scenario
  if (target <= now) target.setDate(target.getDate() + 1);

  const diffMs = target.getTime() - now.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

/** Pad number to 2 digits */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

