import { addDays, dayDiff, fromKey, shortDate, toKey } from "@/utils/dayKey";

export type PlanCategory = "date" | "home" | "travel" | "money" | "errands" | "wellbeing";

export const PLAN_CATEGORIES: { key: PlanCategory; label: string; emoji: string; color: string }[] = [
  { key: "date", label: "Date", emoji: "💞", color: "#E0567A" },
  { key: "home", label: "Home", emoji: "🏡", color: "#4FB39C" },
  { key: "travel", label: "Travel", emoji: "✈️", color: "#5B8DEF" },
  { key: "money", label: "Money", emoji: "💷", color: "#E6B450" },
  { key: "errands", label: "Errands", emoji: "🛒", color: "#A47FD6" },
  { key: "wellbeing", label: "Wellbeing", emoji: "🌿", color: "#7BC47F" },
];

export const categoryOf = (key?: string | null) => PLAN_CATEGORIES.find((category) => category.key === key);

/** Quick due-date shortcuts, de-duplicated (e.g. "Weekend" on a Saturday is today). */
export const dueOptions = (today = new Date()) => {
  const dow = today.getDay();
  const weekend = dow === 6 || dow === 0 ? today : addDays(today, 6 - dow);
  const nextMonday = addDays(today, (8 - dow) % 7 || 7);
  const options = [
    { label: "Today", key: toKey(today) },
    { label: "Tomorrow", key: toKey(addDays(today, 1)) },
    { label: "Weekend", key: toKey(weekend) },
    { label: "Next week", key: toKey(nextMonday) },
  ];
  return options.filter((option, index) => options.findIndex((other) => other.key === option.key) === index);
};

export type DueTone = "overdue" | "today" | "soon" | "later";

export const dueLabel = (key: string, today = new Date()): { text: string; tone: DueTone } => {
  const date = fromKey(key);
  const diff = dayDiff(date, today);
  if (diff < 0) return { text: diff === -1 ? "Yesterday" : shortDate(date), tone: "overdue" };
  if (diff === 0) return { text: "Today", tone: "today" };
  if (diff === 1) return { text: "Tomorrow", tone: "soon" };
  if (diff < 7) return { text: date.toLocaleDateString(undefined, { weekday: "long" }), tone: "soon" };
  return { text: shortDate(date), tone: "later" };
};

export type PlanGroup = "overdue" | "today" | "tomorrow" | "week" | "later" | "anytime";

export const PLAN_GROUPS: { key: PlanGroup; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This week" },
  { key: "later", label: "Later" },
  { key: "anytime", label: "Anytime" },
];

export const groupFor = (dueDate?: string | null, today = new Date()): PlanGroup => {
  if (!dueDate) return "anytime";
  const diff = dayDiff(fromKey(dueDate), today);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 7) return "week";
  return "later";
};

export const PLAN_SUGGESTIONS: { text: string; category: PlanCategory }[] = [
  { text: "Plan our next date night", category: "date" },
  { text: "Weekly food shop", category: "errands" },
  { text: "Book a weekend away", category: "travel" },
  { text: "Set a shared savings goal", category: "money" },
  { text: "Deep clean the kitchen", category: "home" },
  { text: "Go for a long walk together", category: "wellbeing" },
];
