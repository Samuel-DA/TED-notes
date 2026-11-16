// utils/questionDeck.ts — the daily "pick a card" deck for Today's question.
// Cards are computed deterministically from the pair, the date and what's already
// been asked, so both partners always see the same three cards without a write.
import { QUESTIONS, type QuestionData } from "./dailyQuestions";

export type TopicKey = "us" | "deep" | "fun" | "future" | "faith";

export const TOPICS: { key: TopicKey; label: string; emoji: string; ranges: [number, number][] }[] = [
  { key: "us", label: "Us", emoji: "💞", ranges: [[1, 100], [401, 600], [701, 800]] },
  { key: "deep", label: "Deep", emoji: "🌊", ranges: [[101, 200], [601, 700], [976, 988]] },
  { key: "fun", label: "Fun", emoji: "🎉", ranges: [[201, 300], [851, 975]] },
  { key: "future", label: "Future", emoji: "🌅", ranges: [[301, 400], [801, 850]] },
  { key: "faith", label: "Faith", emoji: "🙏", ranges: [[989, 1100]] },
];

export type Suggestion = { id: string; text: string; by: string; at: number };

export type QuestionCard = {
  /** Question id from the bank, or null for a partner-suggested topic. */
  id: number | null;
  text: string;
  topic: TopicKey | "suggested";
  suggestion?: Suggestion;
};

/** Strip the "#123" bookkeeping suffix from bank questions. */
export const cleanQuestion = (text: string) => text.replace(/\s*#\d+\s*$/, "").trim();

export const topicOf = (id: number): TopicKey =>
  TOPICS.find((topic) => topic.ranges.some(([a, b]) => id >= a && id <= b))?.key ?? "deep";

export const topicMeta = (key: QuestionCard["topic"]) =>
  key === "suggested" ? { label: "Suggested", emoji: "💡" } : TOPICS.find((t) => t.key === key)!;

const hash = (input: string) => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** The three cards on offer today. Suggestions from either partner are dealt first. */
export function cardsForDay(pairId: string, dateKey: string, askedIds: number[], suggestions: Suggestion[]): QuestionCard[] {
  const random = rng(hash(`${pairId}:${dateKey}`));
  const asked = new Set(askedIds);
  const seenTexts = new Set<string>();
  const cards: QuestionCard[] = [];

  const nextSuggestion = [...suggestions].sort((a, b) => a.at - b.at)[0];
  if (nextSuggestion) cards.push({ id: null, text: nextSuggestion.text, topic: "suggested", suggestion: nextSuggestion });

  const topics = [...TOPICS];
  for (let i = topics.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [topics[i], topics[j]] = [topics[j], topics[i]]; }
  for (const topic of topics) {
    if (cards.length >= 3) break;
    const inTopic = QUESTIONS.filter((q) => topicOf(q.id) === topic.key);
    let pool = inTopic.filter((q) => !asked.has(q.id));
    if (!pool.length) pool = inTopic; // whole topic used up: start it again
    pool = pool.filter((q) => !seenTexts.has(cleanQuestion(q.question)));
    if (!pool.length) continue;
    const pick: QuestionData = pool[Math.floor(random() * pool.length)];
    seenTexts.add(cleanQuestion(pick.question));
    cards.push({ id: pick.id, text: cleanQuestion(pick.question), topic: topic.key });
  }
  return cards;
}
