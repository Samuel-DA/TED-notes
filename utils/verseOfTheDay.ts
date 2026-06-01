// utils/verseOfTheDay.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BIBLE } from "./bibleIndex";

/* ---------- TYPES ---------- */

export type VerseData = {
  reference: string;
  text: string;
  translation: string;
};

/* ---------- CONSTANTS ---------- */

const STORAGE_KEY = "@verse_of_the_day";

/* ---------- HELPERS ---------- */

const getDaySeed = () => {
  // Days since Unix epoch → same verse globally per day
  return Math.floor(Date.now() / 86_400_000);
};

/* ---------- MAIN FUNCTION ---------- */

export async function getVerseOfTheDay(): Promise<VerseData> {
  const today = new Date().toDateString();

  // 1️⃣ Return cached verse if already fetched today
  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed.date === today) {
      return parsed.verse as VerseData;
    }
  }

  // 2️⃣ Deterministic rotation through Bible
  const seed = getDaySeed();

  const bookIndex = seed % BIBLE.length;
  const book = BIBLE[bookIndex];

  const chapter = (seed % book.chapters) + 1;

  // Use a safe verse range (most chapters have ≥ 20)
  const verseNumber = (seed % 20) + 1;

  const reference = `${book.book} ${chapter}:${verseNumber}`;

  // 3️⃣ Fetch from bible-api.com (no key)
  const response = await fetch(
    `https://bible-api.com/${encodeURIComponent(reference)}`
  );

  const data = await response.json();

  // 4️⃣ Defensive fallback (API sometimes misses verses)
  const verse: VerseData = {
    reference: data?.reference ?? reference,
    text:
      data?.text?.trim() ??
      "Be still, and know that I am God.",
    translation: data?.translation_name ?? "World English Bible",
  };

  // 5️⃣ Cache for the day
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: today, verse })
  );

  return verse;
}