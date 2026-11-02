import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { dayDiff, fromKey, toKey } from "@/utils/dayKey";

type Props = {
  value: string | null;
  onChange: (key: string) => void;
  /** Earliest selectable day (YYYY-MM-DD). */
  minDate?: string;
};

/** Compact Monday-first month calendar. Values are local YYYY-MM-DD keys. */
export default function DatePicker({ value, onChange, minDate }: Props) {
  const t = useTheme();
  const s = useStyles();
  const today = useMemo(() => new Date(), []);
  const initial = value ? fromKey(value) : today;
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[];
  }, [month]);

  const min = minDate ? fromKey(minDate) : null;
  const canGoBack = !min || new Date(month.getFullYear(), month.getMonth(), 0) >= new Date(min.getFullYear(), min.getMonth(), 1);

  return (
    <View>
      <View style={s.nav}>
        <Pressable accessibilityLabel="Previous month" disabled={!canGoBack} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={[s.navButton, !canGoBack && { opacity: 0.3 }]}><ChevronLeft color={t.text} size={18} /></Pressable>
        <Text style={s.month}>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
        <Pressable accessibilityLabel="Next month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={s.navButton}><ChevronRight color={t.text} size={18} /></Pressable>
      </View>
      <View style={s.week}>{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <Text key={`${d}${i}`} style={s.weekText}>{d}</Text>)}</View>
      <View style={s.grid}>
        {cells.map((date, index) => {
          if (!date) return <View key={`b${index}`} style={s.cell} />;
          const key = toKey(date);
          const disabled = !!min && dayDiff(date, min) < 0;
          const selected = key === value;
          const isToday = dayDiff(date, today) === 0;
          return (
            <Pressable key={key} disabled={disabled} onPress={() => { void Haptics.selectionAsync(); onChange(key); }} style={s.cell}>
              <View style={[s.day, isToday && s.today, selected && { backgroundColor: t.accent, borderColor: t.accent }]}>
                <Text style={[s.dayText, disabled && { color: t.textMuted, opacity: 0.5 }, selected && { color: "#fff", fontWeight: "800" }]}>{date.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navButton: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  month: { color: t.text, fontSize: 16, fontWeight: "800" },
  week: { flexDirection: "row", marginBottom: 4 },
  weekText: { width: "14.285%", textAlign: "center", color: t.textMuted, fontSize: 11, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  day: { width: "84%", aspectRatio: 1, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "transparent" },
  today: { borderColor: t.borderStrong },
  dayText: { color: t.text, fontSize: 14, fontWeight: "600" },
}));
