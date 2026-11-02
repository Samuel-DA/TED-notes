// Shared, theme-aware styles for the couple games.
import { makeStyles } from "@/hooks/useTheme";

export const useGameStyles = makeStyles((t) => ({
  card: { backgroundColor: t.surface, borderRadius: 24, padding: 18, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: t.border, ...t.shadow },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  title: { fontSize: 22, fontWeight: "800", color: t.text, letterSpacing: -0.4 },
  description: { fontSize: 14, color: t.textSecondary, lineHeight: 20, marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: "700", color: t.textSecondary, marginBottom: 7, marginTop: 8 },
  input: { backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: t.text, marginBottom: 12 },
  btn: { backgroundColor: t.accent, borderRadius: 16, minHeight: 52, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15.5 },
  promptContainer: { backgroundColor: t.violetSoft, padding: 18, borderRadius: 20, alignItems: "center", marginVertical: 12 },
  promptText: { fontSize: 19, fontWeight: "800", color: t.violetText, textAlign: "center", lineHeight: 25 },
  waitingContainer: { alignItems: "center", paddingVertical: 16 },
  waitingText: { color: t.textSecondary, fontSize: 15, fontWeight: "500", textAlign: "center" },
  winContainer: { alignItems: "center", paddingVertical: 12 },
  winText: { fontSize: 21, fontWeight: "800", color: t.text, textAlign: "center", marginTop: 8 },
  revealText: { fontSize: 14, color: t.textSecondary, marginTop: 4, textAlign: "center" },
  resetBtn: { backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, borderRadius: 16, minHeight: 48, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: 16 },
  resetText: { color: t.text, fontWeight: "800", fontSize: 15 },
}));
