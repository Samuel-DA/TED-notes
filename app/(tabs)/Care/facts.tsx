import { BookOpen, Church, ExternalLink, Landmark, RefreshCw, ScrollText } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CareCard, CarePage, careStyles } from "@/components/care/CareUI";
import { palette } from "@/constants/design";

type Category = "Christianity" | "Politics" | "History";
type Fact = { title: string; extract: string; url: string; kind?: "Quick teaching" | "Did you know?" };

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

const CATEGORIES: { name: Category; icon: React.ComponentType<{ color: string; size: number }> }[] = [
  { name: "Christianity", icon: Church },
  { name: "Politics", icon: Landmark },
  { name: "History", icon: ScrollText },
];

export default function FactsPage() {
  const [category, setCategory] = useState<Category>("Christianity");
  const [factIndex, setFactIndex] = useState(0);
  const fact = FACTS[category][factIndex];
  const countLabel = useMemo(() => `${FACTS[category].length} curated cards`, [category]);

  const selectCategory = (nextCategory: Category) => {
    setCategory(nextCategory);
    setFactIndex(0);
  };

  const showAnother = () => {
    const total = FACTS[category].length;
    setFactIndex((current) => (current + 1 + Math.floor(Math.random() * (total - 1))) % total);
  };

  return (
    <CarePage eyebrow="DISCOVER" title="Knowledge & facts" subtitle="Learn something short, thoughtful and worth discussing." icon={<BookOpen color="#fff" size={23} />}>
      <View style={styles.categories}>
        {CATEGORIES.map(({ name, icon: Icon }) => (
          <Pressable key={name} onPress={() => selectCategory(name)} style={[styles.chip, category === name && styles.chipActive]}>
            <Icon color={category === name ? "#fff" : palette.plum} size={16} />
            <Text numberOfLines={1} style={[styles.chipText, category === name && styles.chipTextActive]}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <CareCard title={category} subtitle={countLabel}>
        <View style={styles.art}>
          <Text style={styles.watermark}>{category === "Christianity" ? "✝" : category === "Politics" ? "⚖" : "⌛"}</Text>
          <Text style={styles.kicker}>{fact.kind || "Did you know?"}</Text>
        </View>
        <Text style={styles.factTitle}>{fact.title}</Text>
        <Text style={styles.factText}>{fact.extract}</Text>
        <View style={styles.actions}>
          <Pressable onPress={showAnother} style={[careStyles.primaryButton, { flex: 1 }]}>
            <RefreshCw color="#fff" size={17} />
            <Text style={careStyles.primaryText}>Another card</Text>
          </Pressable>
          <Pressable accessibilityLabel="Open source" onPress={() => Linking.openURL(fact.url)} style={styles.source}>
            <ExternalLink color={palette.plum} size={18} />
          </Pressable>
        </View>
      </CareCard>
      <Text style={styles.note}>Christian content is Bible-centred. Politics cards focus on civic knowledge, not party persuasion. Open the source for wider context.</Text>
    </CarePage>
  );
}

const styles = StyleSheet.create({
  categories: { flexDirection: "row", gap: 7, marginBottom: 14 },
  chip: { flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.74)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", paddingHorizontal: 5 },
  chipActive: { backgroundColor: "rgba(91,46,117,0.9)", borderColor: "rgba(255,255,255,0.24)" },
  chipText: { color: palette.plum, fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  art: { minHeight: 94, borderRadius: 13, backgroundColor: "rgba(33,23,42,0.94)", overflow: "hidden", padding: 16, justifyContent: "flex-end", marginBottom: 18 },
  watermark: { position: "absolute", right: 14, top: -23, color: "rgba(255,255,255,0.09)", fontSize: 106, fontWeight: "900" },
  kicker: { color: "#F0B9C4", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  factTitle: { color: palette.text, fontSize: 23, fontWeight: "700", letterSpacing: -0.5 },
  factText: { color: palette.muted, fontSize: 14, lineHeight: 22, marginTop: 9 },
  actions: { flexDirection: "row", gap: 9, marginTop: 18 },
  source: { width: 50, height: 50, borderRadius: 12, backgroundColor: "#F1E7F2", alignItems: "center", justifyContent: "center" },
  note: { color: "#DED2E2", fontSize: 10.5, lineHeight: 16, paddingHorizontal: 8, textAlign: "center" },
});
