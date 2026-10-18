import { BookOpen, Church, ExternalLink, Landmark, RefreshCw, ScrollText } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CareCard, CarePage, careStyles } from "@/components/care/CareUI";
import { palette } from "@/constants/design";

type Category = "Religion" | "Politics" | "History";
type Fact = { title: string; extract: string; url: string };
const FALLBACKS: Record<Category, Fact[]> = {
  Religion: [
    { title: "The word amen", extract: "Amen is an ancient word used across Jewish, Christian and Islamic traditions to express agreement, certainty or affirmation.", url: "https://en.wikipedia.org/wiki/Amen" },
    { title: "A very old pilgrimage", extract: "The Hajj pilgrimage has brought worshippers to Mecca for many centuries and is one of the Five Pillars of Islam.", url: "https://en.wikipedia.org/wiki/Hajj" },
  ],
  Politics: [
    { title: "The shortest war", extract: "The Anglo-Zanzibar War of 1896 is commonly described as the shortest recorded war, lasting less than an hour.", url: "https://en.wikipedia.org/wiki/Anglo-Zanzibar_War" },
    { title: "A portable voting tradition", extract: "Ancient Athenians sometimes voted using pottery fragments called ostraka, which helped give us the word ostracism.", url: "https://en.wikipedia.org/wiki/Ostracism" },
  ],
  History: [
    { title: "Oxford before the Aztec Empire", extract: "Teaching existed at Oxford by the late eleventh century, centuries before the Aztec Empire was founded.", url: "https://en.wikipedia.org/wiki/University_of_Oxford" },
    { title: "Cleopatra and the Moon landing", extract: "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.", url: "https://en.wikipedia.org/wiki/Cleopatra" },
  ],
};
const CATEGORIES: { name: Category; icon: React.ComponentType<{ color: string; size: number }> }[] = [{ name: "Religion", icon: Church }, { name: "Politics", icon: Landmark }, { name: "History", icon: ScrollText }];

export default function FactsPage() {
  const [category, setCategory] = useState<Category>("History"); const [fact, setFact] = useState<Fact>(FALLBACKS.History[0]); const [loading, setLoading] = useState(false);
  const load = async (nextCategory = category) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "query", format: "json", generator: "categorymembers", gcmtitle: `Category:${nextCategory}`, gcmtype: "page", gcmlimit: "50", prop: "extracts|info", exintro: "1", explaintext: "1", exsentences: "4", inprop: "url", origin: "*" });
      const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`); const json = await response.json();
      const pages = Object.values(json?.query?.pages || {}).filter((page) => { const item = page as { extract?: string }; return item.extract && item.extract.length > 80; }) as { title: string; extract: string; fullurl?: string }[];
      if (!pages.length) throw new Error("No fact returned"); const page = pages[Math.floor(Math.random() * pages.length)]; setFact({ title: page.title, extract: page.extract, url: page.fullurl || "https://en.wikipedia.org" });
    } catch { const options = FALLBACKS[nextCategory]; setFact(options[Math.floor(Math.random() * options.length)]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(category); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps
  return <CarePage eyebrow="DISCOVER" title="Knowledge & random facts" subtitle="Choose a subject and find something worth discussing." icon={<BookOpen color="#fff" size={23} />}>
    <View style={styles.categories}>{CATEGORIES.map(({ name, icon: Icon }) => <Pressable key={name} onPress={() => setCategory(name)} style={[styles.chip, category === name && styles.chipActive]}><Icon color={category === name ? "#fff" : palette.plum} size={17} /><Text style={[styles.chipText, category === name && styles.chipTextActive]}>{name}</Text></Pressable>)}</View>
    <CareCard title={category} subtitle="From Wikipedia’s public knowledge collection">
      <View style={styles.art}><Text style={styles.watermark}>{category === "Religion" ? "☼" : category === "Politics" ? "⚖" : "⌛"}</Text><Text style={styles.kicker}>RANDOM {category.toUpperCase()} FACT</Text></View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={palette.rose} /><Text style={styles.loadingText}>Finding something interesting…</Text></View> : <><Text style={styles.factTitle}>{fact.title}</Text><Text style={styles.factText}>{fact.extract}</Text></>}
      <View style={styles.actions}><Pressable onPress={() => load()} disabled={loading} style={[careStyles.primaryButton, { flex: 1 }]}><RefreshCw color="#fff" size={17} /><Text style={careStyles.primaryText}>Another fact</Text></Pressable><Pressable accessibilityLabel="Open source" onPress={() => Linking.openURL(fact.url)} style={styles.source}><ExternalLink color={palette.plum} size={18} /></Pressable></View>
    </CareCard>
    <Text style={styles.note}>Politics and religion can be complex. Facts are offered as conversation starters; open the source to read the wider context.</Text>
  </CarePage>;
}

const styles = StyleSheet.create({
  categories: { flexDirection: "row", gap: 8, marginBottom: 14 }, chip: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.74)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" }, chipActive: { backgroundColor: "rgba(91,46,117,0.88)", borderColor: "rgba(255,255,255,0.24)" }, chipText: { color: palette.plum, fontSize: 12, fontWeight: "900" }, chipTextActive: { color: "#fff" }, art: { minHeight: 110, borderRadius: 20, backgroundColor: "rgba(33,23,42,0.92)", overflow: "hidden", padding: 16, justifyContent: "flex-end", marginBottom: 18 }, watermark: { position: "absolute", right: 14, top: -18, color: "rgba(255,255,255,0.09)", fontSize: 110, fontWeight: "900" }, kicker: { color: "#F9A8D4", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 }, factTitle: { color: palette.text, fontSize: 23, fontWeight: "900", letterSpacing: -0.5 }, factText: { color: palette.muted, fontSize: 14, lineHeight: 22, marginTop: 9 }, loading: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10 }, loadingText: { color: palette.muted, fontSize: 12 }, actions: { flexDirection: "row", gap: 9, marginTop: 18 }, source: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#F1E7F2", alignItems: "center", justifyContent: "center" }, note: { color: "#DED2E2", fontSize: 10.5, lineHeight: 16, paddingHorizontal: 8, textAlign: "center" },
});
