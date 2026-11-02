import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, BookOpen, Church, ExternalLink, Landmark, Layers, ScrollText, Share2, Shuffle, Sparkles } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Linking, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { CarePage } from "@/components/care/CareUI";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Category = "Christianity" | "Politics" | "History";
type Filter = "All" | Category | "Saved";
type Fact = { title: string; extract: string; url: string; kind?: "Quick teaching" | "Did you know?" };
type Card = Fact & { id: string; category: Category };

const FACTS: Record<Category, Fact[]> = {
  Christianity: [
    { title: "The shortest verse", extract: "‘Jesus wept’ in John 11:35 is commonly the shortest verse in many English Bible translations. Its two words still show something profound: Jesus did not stay distant from human grief.", url: "https://www.biblegateway.com/passage/?search=John%2011%3A35" },
    { title: "Paul was a Roman citizen", extract: "Paul was Jewish and also held Roman citizenship. In Acts 22, that status protected him from an unlawful flogging and gave him important legal rights as he travelled and preached.", url: "https://www.biblegateway.com/passage/?search=Acts%2022%3A25-29" },
    { title: "Noah and the sign of the covenant", extract: "Genesis 6–9 tells how Noah obeyed God in building the ark. After the flood, the rainbow became the sign of God’s covenant that the earth would never again be destroyed by a flood.", url: "https://www.biblegateway.com/passage/?search=Genesis%206-9" },
    { title: "Agape: love that chooses", extract: "Agape is one Greek word used for love in the New Testament. It points toward self-giving love expressed through commitment and action—not merely a passing feeling.", url: "https://www.biblegateway.com/passage/?search=1%20Corinthians%2013" },
    { title: "A quick teaching on faith", kind: "Quick teaching", extract: "Biblical faith is confident trust in God that reshapes how we live. Hebrews 11 describes its assurance; James 2 reminds us that living faith becomes visible through action. Today, take one small step that matches what you say you trust God for.", url: "https://www.biblegateway.com/passage/?search=Hebrews%2011%3A1%2CJames%202%3A17" },
    { title: "Jesus gave a pattern for prayer", extract: "The Lord’s Prayer begins with worship, welcomes God’s will, asks for daily provision and forgiveness, and seeks protection. It is a pattern for a whole relationship with God, not only words to repeat.", url: "https://www.biblegateway.com/passage/?search=Matthew%206%3A9-13" },
    { title: "The greatest commandments", extract: "Jesus summarised the heart of God’s law as loving God fully and loving your neighbour as yourself. Christian maturity therefore has both a Godward and a peopleward direction.", url: "https://www.biblegateway.com/passage/?search=Matthew%2022%3A37-40" },
    { title: "The fruit of the Spirit", extract: "Galatians lists love, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control as the fruit produced by the Spirit in a believer’s life.", url: "https://www.biblegateway.com/passage/?search=Galatians%205%3A22-23" },
    { title: "First called Christians at Antioch", extract: "Acts records that the disciples were first called Christians in Antioch, a diverse and influential city in the Roman world.", url: "https://www.biblegateway.com/passage/?search=Acts%2011%3A26" },
    { title: "Four portraits of Jesus", extract: "The New Testament opens with four Gospels—Matthew, Mark, Luke and John. They tell the same central good news while emphasising different details, audiences and themes.", url: "https://www.biblesociety.org.uk/explore-the-bible/" },
    { title: "Grace creates a new way of life", kind: "Quick teaching", extract: "Ephesians 2 teaches that salvation is God’s gift, not something we earn. The same passage says we are created for good works: grace does not purchase love from God; it frees us to live from that love.", url: "https://www.biblegateway.com/passage/?search=Ephesians%202%3A8-10" },
    { title: "The Bible is a library", extract: "The Protestant Bible contains 66 books written across many centuries and literary forms—including history, poetry, prophecy, letters and Gospel—yet Christians read them as one unfolding story of creation, fall, rescue and restoration.", url: "https://www.biblesociety.org.uk/explore-the-bible/" },
  ],
  Politics: [
    { title: "Parliament and government are different", extract: "The UK Government runs the country day to day. Parliament represents the public, makes and changes laws, approves taxation and spending, and holds the Government to account.", url: "https://www.parliament.uk/about/how/role/relations-with-other-institutions/parliament-government/" },
    { title: "The UK Parliament has two Houses", extract: "The House of Commons and House of Lords both debate legislation and scrutinise government. The two-chamber system lets each House examine the work of the other.", url: "https://www.parliament.uk/about/how/role/system/" },
    { title: "Commons and Lords are formed differently", extract: "Members of the House of Commons are publicly elected. Most members of the House of Lords are appointed and bring experience from many areas of public life.", url: "https://www.parliament.uk/about/how/role/system/" },
    { title: "Green Commons, red Lords", extract: "The House of Commons chamber is associated with green, while the House of Lords is associated with red—one of Parliament’s most visible traditions.", url: "https://www.parliament.uk/about/how/role/system/" },
    { title: "Scrutiny is a core job", extract: "Parliament does more than pass laws. Questions, debates and committees are tools used to examine government decisions and public spending.", url: "https://www.parliament.uk/about/how/role/" },
    { title: "A Bill is not yet an Act", extract: "A Bill is a proposal for a new law or a change to an existing law. It must pass the required parliamentary stages and receive Royal Assent before becoming an Act of Parliament.", url: "https://www.parliament.uk/about/how/laws/bills/" },
    { title: "Every UN member has one General Assembly vote", extract: "Large and small states have equal voting status in the UN General Assembly: each Member State has one vote.", url: "https://www.un.org/en/ga/about/ropga/plenary.shtml" },
    { title: "Some UN decisions need two thirds", extract: "Important General Assembly questions—such as peace and security recommendations, membership and budget matters—require a two-thirds majority of members present and voting.", url: "https://www.un.org/en/ga/about/ropga/plenary.shtml" },
    { title: "Consensus can matter more than a vote", extract: "Although formal voting rules exist, many UN General Assembly resolutions are adopted by consensus after negotiation rather than by a recorded vote.", url: "https://www.un.org/en/ga/about/background.shtml" },
    { title: "A democracy needs an informed public", kind: "Quick teaching", extract: "Healthy democratic participation is more than choosing a side. It includes checking sources, understanding which institution holds a power, listening across disagreement and holding representatives accountable.", url: "https://www.parliament.uk/about/how/role/" },
  ],
  History: [
    { title: "Oxford predates the Aztec Empire", extract: "Teaching existed at Oxford by the late eleventh century—centuries before the Aztec Empire rose in central Mexico.", url: "https://www.ox.ac.uk/about/organisation/history" },
    { title: "Cleopatra lived closer to the Moon landing", extract: "Cleopatra VII lived nearer in time to the 1969 Apollo 11 Moon landing than to the construction of the Great Pyramid of Giza.", url: "https://www.britannica.com/biography/Cleopatra-queen-of-Egypt" },
    { title: "The Rosetta Stone unlocked a script", extract: "Because the Rosetta Stone carries related text in multiple scripts, including Greek, it became crucial to deciphering ancient Egyptian hieroglyphs.", url: "https://www.britishmuseum.org/collection/object/Y_EA24" },
    { title: "Magna Carta was sealed in 1215", extract: "Magna Carta began as a peace agreement between King John and rebel barons. Its later legacy helped shape the idea that rulers are also subject to law.", url: "https://www.parliament.uk/magnacarta/" },
    { title: "The ancient Olympics", extract: "The traditional date for the first recorded ancient Olympic Games is 776 BC. The festival was held at Olympia in honour of Zeus.", url: "https://olympics.com/ioc/ancient-olympic-games" },
    { title: "Printing accelerated the spread of ideas", extract: "Johannes Gutenberg’s mid-fifteenth-century printing system helped books and ideas circulate through Europe far more quickly and at larger scale.", url: "https://www.britannica.com/biography/Johannes-Gutenberg" },
    { title: "The Great Fire changed London", extract: "The Great Fire of London began in 1666 and destroyed much of the medieval city, leading to major rebuilding and stricter approaches to construction.", url: "https://www.museumoflondon.org.uk/discover/great-fire-london-1666" },
    { title: "Humans first walked on the Moon in 1969", extract: "Apollo 11 landed on 20 July 1969. Neil Armstrong and Buzz Aldrin walked on the lunar surface while Michael Collins remained in lunar orbit.", url: "https://www.nasa.gov/mission/apollo-11/" },
  ],
};

const THEMES: Record<Category, { icon: React.ComponentType<{ color: string; size: number }>; colors: readonly [string, string, string]; accent: string }> = {
  Christianity: { icon: Church, colors: ["#6B2F7E", "#A63E64", "#C9566E"], accent: "#FFD2DD" },
  Politics: { icon: Landmark, colors: ["#1F2F6B", "#3B3A8F", "#5A3F95"], accent: "#CFD9FF" },
  History: { icon: ScrollText, colors: ["#6E3F12", "#8A4B2A", "#5B2E75"], accent: "#FFE1B8" },
};
const FILTERS: Filter[] = ["All", "Christianity", "Politics", "History", "Saved"];
const ALL_CARDS: Card[] = (Object.keys(FACTS) as Category[]).flatMap((category) => FACTS[category].map((fact) => ({ ...fact, category, id: `${category}:${fact.title}` })));
const SAVED_KEY = "ted-facts-saved-v1";
const SEEN_KEY = "ted-facts-seen-v1";
const GAP = 12;
const randomOther = (count: number, avoid: number) => { let next = avoid; while (next === avoid) next = Math.floor(Math.random() * count); return next; };
type ViewableInfo = Parameters<NonNullable<React.ComponentProps<typeof FlatList>["onViewableItemsChanged"]>>[0];

const domainOf = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
const dayIndex = () => { const now = new Date(); return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000); };

const readSet = async (key: string) => { try { const raw = await AsyncStorage.getItem(key); return new Set<string>(raw ? JSON.parse(raw) : []); } catch { return new Set<string>(); } };
const writeSet = (key: string, value: Set<string>) => { AsyncStorage.setItem(key, JSON.stringify([...value])).catch(() => undefined); };

export default function FactsPage() {
  const t = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;
  const listRef = useRef<FlatList<Card>>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => { void readSet(SAVED_KEY).then(setSaved); void readSet(SEEN_KEY).then(setSeen); }, []);

  const todays = useMemo(() => ALL_CARDS[dayIndex() % ALL_CARDS.length], []);
  const cards = useMemo(() => {
    if (filter === "All") return ALL_CARDS;
    if (filter === "Saved") return ALL_CARDS.filter((card) => saved.has(card.id));
    return ALL_CARDS.filter((card) => card.category === filter);
  }, [filter, saved]);

  const markSeen = useCallback((id: string) => {
    setSeen((current) => {
      if (current.has(id)) return current;
      const next = new Set(current).add(id);
      writeSet(SEEN_KEY, next);
      return next;
    });
  }, []);

  const onViewable = useRef(({ viewableItems }: ViewableInfo) => {
    const first = viewableItems[0];
    if (first?.index != null) { setIndex(first.index); if (first.item) markSeen((first.item as Card).id); }
  }).current;

  const selectFilter = (next: Filter) => {
    void Haptics.selectionAsync();
    setFilter(next);
    setIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const jumpTo = (target: number, animated = true) => {
    if (target < 0 || target >= cards.length) return;
    listRef.current?.scrollToOffset({ offset: target * (cardWidth + GAP), animated });
    setIndex(target);
  };

  const shuffle = () => {
    if (cards.length < 2) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    jumpTo(randomOther(cards.length, index));
  };

  const toggleSave = (card: Card) => {
    void Haptics.selectionAsync();
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(card.id)) next.delete(card.id); else next.add(card.id);
      writeSet(SAVED_KEY, next);
      return next;
    });
  };

  const share = (card: Card) => { void Share.share({ message: `${card.title}\n\n${card.extract}\n\nSource: ${card.url}` }); };

  const openToday = () => {
    const nextFilter: Filter = todays.category;
    setFilter(nextFilter);
    const target = ALL_CARDS.filter((card) => card.category === nextFilter).findIndex((card) => card.id === todays.id);
    markSeen(todays.id);
    requestAnimationFrame(() => setTimeout(() => jumpTo(Math.max(0, target), false), 50));
  };

  const todaysTheme = THEMES[todays.category];
  const TodayIcon = todaysTheme.icon;
  const progress = cards.length ? (index + 1) / cards.length : 0;

  return (
    <CarePage eyebrow="DISCOVER" title="Knowledge & facts" subtitle="Short, thoughtful cards worth talking about." icon={<BookOpen color="#fff" size={23} />}>
      {/* Today's card */}
      <Pressable onPress={openToday} style={({ pressed }) => [styles.today, pressed && styles.pressed]}>
        <LinearGradient colors={todaysTheme.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.todayWatermark}><TodayIcon color="rgba(255,255,255,0.10)" size={120} /></View>
        <View style={styles.todayBadge}><Sparkles color="#fff" size={12} /><Text style={styles.todayBadgeText}>TODAY&apos;S CARD</Text></View>
        <Text style={styles.todayTitle} numberOfLines={2}>{todays.title}</Text>
        <Text style={styles.todayText} numberOfLines={2}>{todays.extract}</Text>
        <Text style={[styles.todayCta, { color: todaysTheme.accent }]}>Read card →</Text>
      </Pressable>

      {/* Explored */}
      <View style={styles.explored}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exploredText}><Text style={styles.exploredStrong}>{seen.size}</Text> of {ALL_CARDS.length} cards explored</Text>
          <View style={styles.exploredTrack}><View style={[styles.exploredFill, { width: `${(seen.size / ALL_CARDS.length) * 100}%` }]} /></View>
        </View>
        <View style={styles.savedPill}><Bookmark color={t.accentText} size={13} fill={t.accentText} /><Text style={styles.savedPillText}>{saved.size}</Text></View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item;
          const Icon = item === "All" ? Layers : item === "Saved" ? Bookmark : THEMES[item].icon;
          return (
            <Pressable key={item} onPress={() => selectFilter(item)} style={[styles.filter, active && styles.filterActive]}>
              <Icon color={active ? t.onInverse : t.textSecondary} size={14} />
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}{item === "Saved" && saved.size ? ` · ${saved.size}` : ""}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Deck */}
      {cards.length ? (
        <FlatList
          ref={listRef}
          data={cards}
          keyExtractor={(card) => card.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + GAP}
          decelerationRate="fast"
          disableIntervalMomentum
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          getItemLayout={(_, i) => ({ length: cardWidth + GAP, offset: (cardWidth + GAP) * i, index: i })}
          renderItem={({ item }) => <FactCard card={item} width={cardWidth} saved={saved.has(item.id)} onSave={() => toggleSave(item)} onShare={() => share(item)} />}
        />
      ) : (
        <View style={styles.empty}>
          <Bookmark color={t.textMuted} size={28} />
          <Text style={styles.emptyTitle}>No saved cards yet</Text>
          <Text style={styles.emptyText}>Tap the bookmark on any card to keep it here.</Text>
        </View>
      )}

      {/* Deck controls */}
      {cards.length > 0 && (
        <View style={styles.controls}>
          <Text style={styles.counter}>{index + 1}<Text style={styles.counterTotal}> / {cards.length}</Text></Text>
          <View style={styles.deckTrack}><View style={[styles.deckFill, { width: `${progress * 100}%` }]} /></View>
          <Pressable accessibilityLabel="Shuffle" onPress={shuffle} style={({ pressed }) => [styles.shuffle, pressed && styles.pressed]}>
            <Shuffle color={t.text} size={16} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.note}>Christian content is Bible-centred. Politics cards focus on civic knowledge, not party persuasion. Open the source for wider context.</Text>
    </CarePage>
  );
}

function FactCard({ card, width, saved, onSave, onShare }: { card: Card; width: number; saved: boolean; onSave: () => void; onShare: () => void }) {
  const styles = useStyles();
  const theme = THEMES[card.category];
  const Icon = theme.icon;
  return (
    <View style={[styles.card, { width }]}>
      <LinearGradient colors={theme.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["transparent", "rgba(10,6,14,0.35)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.cardWatermark}><Icon color="rgba(255,255,255,0.08)" size={190} /></View>
      <View style={styles.cardTop}>
        <View style={styles.categoryBadge}><Icon color="#fff" size={13} /><Text style={styles.categoryText}>{card.category}</Text></View>
        <Text style={[styles.kind, { color: theme.accent }]}>{(card.kind || "Did you know?").toUpperCase()}</Text>
      </View>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardText}>{card.extract}</Text>
      <View style={styles.cardFooter}>
        <Pressable onPress={() => Linking.openURL(card.url)} style={styles.sourceLink} hitSlop={6}>
          <ExternalLink color="rgba(255,255,255,0.8)" size={13} />
          <Text style={styles.sourceText} numberOfLines={1}>{domainOf(card.url)}</Text>
        </Pressable>
        <Pressable accessibilityLabel="Share card" onPress={onShare} style={styles.iconButton}><Share2 color="#fff" size={17} /></Pressable>
        <Pressable accessibilityLabel={saved ? "Remove from saved" : "Save card"} onPress={onSave} style={[styles.iconButton, saved && styles.iconButtonActive]}>
          <Bookmark color={saved ? "#1B1320" : "#fff"} fill={saved ? "#1B1320" : "transparent"} size={17} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  today: { borderRadius: 24, padding: 18, overflow: "hidden", marginBottom: 12, minHeight: 150 },
  todayWatermark: { position: "absolute", right: -18, top: -14 },
  todayBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)" },
  todayBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  todayTitle: { color: "#fff", fontSize: 21, fontWeight: "800", letterSpacing: -0.4, marginTop: 12, maxWidth: "88%" },
  todayText: { color: "rgba(255,255,255,0.78)", fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  todayCta: { fontSize: 13, fontWeight: "800", marginTop: 10 },
  explored: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, marginBottom: 14 },
  exploredText: { color: t.textSecondary, fontSize: 12.5 },
  exploredStrong: { color: t.text, fontWeight: "800" },
  exploredTrack: { height: 4, borderRadius: 2, backgroundColor: t.surfaceSunken, marginTop: 7, overflow: "hidden" },
  exploredFill: { height: 4, borderRadius: 2, backgroundColor: t.accent },
  savedPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: t.surfaceSunken },
  savedPillText: { color: t.text, fontSize: 12, fontWeight: "800" },
  filtersScroll: { marginHorizontal: -16, marginBottom: 14 },
  filters: { gap: 8, paddingHorizontal: 16 },
  filter: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  filterActive: { backgroundColor: t.inverse, borderColor: t.inverse },
  filterText: { color: t.textSecondary, fontSize: 13, fontWeight: "700" },
  filterTextActive: { color: t.onInverse },
  card: { minHeight: 410, borderRadius: 28, padding: 20, overflow: "hidden" },
  cardWatermark: { position: "absolute", right: -40, top: -30 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)" },
  categoryText: { color: "#fff", fontSize: 11.5, fontWeight: "700" },
  kind: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  cardTitle: { color: "#fff", fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.6, marginTop: 36 },
  cardText: { color: "rgba(255,255,255,0.86)", fontSize: 15, lineHeight: 23, marginTop: 12, flex: 1 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 },
  sourceLink: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  sourceText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", flexShrink: 1 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  iconButtonActive: { backgroundColor: "#fff" },
  controls: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14, marginBottom: 18 },
  counter: { color: t.text, fontSize: 15, fontWeight: "800", minWidth: 52 },
  counterTotal: { color: t.textMuted, fontWeight: "600" },
  deckTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: t.surfaceSunken, overflow: "hidden" },
  deckFill: { height: 4, borderRadius: 2, backgroundColor: t.inverse },
  shuffle: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  shuffleText: { color: t.text, fontSize: 13, fontWeight: "700" },
  empty: { minHeight: 260, borderRadius: 28, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderStyle: "dashed", padding: 24, marginBottom: 18 },
  emptyTitle: { color: t.text, fontSize: 17, fontWeight: "800" },
  emptyText: { color: t.textSecondary, fontSize: 13.5, textAlign: "center" },
  note: { color: t.textMuted, fontSize: 11, lineHeight: 16, paddingHorizontal: 8, textAlign: "center" },
}));
