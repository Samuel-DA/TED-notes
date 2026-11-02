/** Local-date helpers using YYYY-MM-DD keys (timezone-safe). */
export const toKey = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const fromKey = (value: string) => new Date(`${value}T12:00:00`);

export const dayDiff = (a: Date, b: Date) =>
  Math.round(
    (new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
      new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) /
      86400000,
  );

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const shortDate = (date: Date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
