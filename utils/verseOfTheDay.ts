// utils/verseOfTheDay.ts
// Verse of the day from a curated list of well-loved verses (King James Version),
// bundled with the app so it works offline and both partners always see the same verse.
import { KJV_TEXT, VERSE_OF_THE_DAY_REFS } from "./scripture";

export type VerseData = {
  reference: string;
  text: string;
  translation: string;
};

/** Local calendar day number, so the verse changes at local midnight. */
export const localDayIndex = (date = new Date()) =>
  Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86_400_000);

/** Step through the list with a large prime so consecutive days jump between themes. */
const STRIDE = 7919;

export function getVerseForDay(date = new Date()): VerseData {
  const n = VERSE_OF_THE_DAY_REFS.length;
  const reference = VERSE_OF_THE_DAY_REFS[(localDayIndex(date) * STRIDE) % n];
  return { reference, text: KJV_TEXT[reference] ?? "", translation: "KJV" };
}

/** Kept async for compatibility with existing callers. */
export async function getVerseOfTheDay(): Promise<VerseData> {
  return getVerseForDay();
}
