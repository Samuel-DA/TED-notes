import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { arrayRemove, arrayUnion, deleteField, doc, runTransaction, updateDoc } from "firebase/firestore";
import { Trash2 } from "lucide-react-native";
import { DeckArt, NoteGlyph, SealedGlyph, SendGlyph, TalkGlyph, TopicGlyph } from "@/components/question/glyphs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Field, Sheet } from "@/components/ui/kit";
import { db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { notifyPartner } from "@/services/notifications";
import { cardsForDay, topicMeta, type QuestionCard, type Suggestion } from "@/utils/questionDeck";

export type PickedQuestion = { id: number | null; text: string; topic: QuestionCard["topic"]; pickedBy: string; suggestedBy?: string | null };
export type QuestionDay = {
  question?: PickedQuestion;
  questionAnswers?: Record<string, string>;
  questionReactions?: Record<string, string>;
};

type Props = {
  pairId: string;
  uid: string;
  partnerUid: string | null;
  myName: string;
  partnerName: string;
  today: string;
  day: QuestionDay;
  askedIds: number[];
  suggestions: Suggestion[];
  /** Shown when answers exist for today but no card was picked (days before this feature). */
  legacyQuestion?: string;
};

const REACTIONS = ["❤️", "😂", "🥹", "😮", "🔥", "🙏"];
const MAX_SUGGESTIONS = 20;
const makeSuggestion = (text: string, by: string): Suggestion => ({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, text, by, at: Date.now() });

export default function QuestionOfTheDay({ pairId, uid, partnerUid, myName, partnerName, today, day, askedIds, suggestions, legacyQuestion }: Props) {
  const t = useTheme();
  const s = useStyles();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const reveal = useRef(new Animated.Value(0)).current;

  const pairRef = doc(db, "pairs", pairId);
  const answers = day.questionAnswers || {};
  const reactions = day.questionReactions || {};
  const myAnswer = answers[uid] || "";
  const partnerAnswer = partnerUid ? answers[partnerUid] || "" : "";
  const bothAnswered = !!myAnswer && !!partnerAnswer;
  const picked = useMemo<PickedQuestion | undefined>(() => day.question ?? (legacyQuestion && (myAnswer || partnerAnswer) ? { id: null, text: legacyQuestion, topic: "deep", pickedBy: "" } : undefined), [day.question, legacyQuestion, myAnswer, partnerAnswer]);
  const cards = useMemo(() => (picked ? [] : cardsForDay(pairId, today, askedIds, suggestions)), [picked, pairId, today, askedIds, suggestions]);
  const nameOf = (id?: string | null) => (id === uid ? "you" : partnerName || "your partner");
  const tone = (topic: QuestionCard["topic"]): [string, string] => {
    switch (topic) {
      case "us": return [t.accentSoft, t.accentText];
      case "deep": return [t.infoSoft, t.infoText];
      case "fun": return [t.warningSoft, t.warningText];
      case "future": return [t.violetSoft, t.violetText];
      case "faith": return [t.successSoft, t.successText];
      default: return [t.accentSoft, t.accentText];
    }
  };

  useEffect(() => {
    if (bothAnswered) Animated.spring(reveal, { toValue: 1, friction: 7, useNativeDriver: true }).start();
    else reveal.setValue(0);
  }, [bothAnswered, reveal]);

  const pick = async (card: QuestionCard) => {
    if (picking) return;
    setPicking(card.text);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const won = await runTransaction(db, async (tx) => {
        const snap = await tx.get(pairRef);
        if (snap.data()?.dailyConfirmations?.[today]?.question) return false; // partner picked first
        tx.update(pairRef, {
          [`dailyConfirmations.${today}.question`]: { id: card.id, text: card.text, topic: card.topic, pickedBy: uid, suggestedBy: card.suggestion?.by ?? null },
          ...(card.id !== null ? { askedQuestionIds: arrayUnion(card.id) } : {}),
          ...(card.suggestion ? { questionSuggestions: arrayRemove(card.suggestion) } : {}),
        });
        return true;
      });
      if (won) void notifyPartner({ pairId, currentUid: uid, route: "home", action: "question_picked", title: "Today's question is ready 🃏", body: `${myName} picked: “${card.text}”` });
    } catch {
      Alert.alert("Couldn't pick that card", "Check your connection and try again.");
    } finally { setPicking(null); }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await updateDoc(pairRef, { [`dailyConfirmations.${today}.questionAnswers.${uid}`]: text });
      setDraft("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void notifyPartner({ pairId, currentUid: uid, route: "home", action: "daily_answer", title: partnerAnswer ? "Answers revealed 🎉" : `${myName} answered today's question 💬`, body: partnerAnswer ? "You've both answered. See what they said." : "Answer too to reveal what they wrote." });
    } catch {
      Alert.alert("Couldn't send your answer", "Check your connection and try again.");
    } finally { setSending(false); }
  };

  const react = async (emoji: string) => {
    void Haptics.selectionAsync();
    const removing = reactions[uid] === emoji;
    await updateDoc(pairRef, { [`dailyConfirmations.${today}.questionReactions.${uid}`]: removing ? deleteField() : emoji }).catch(console.warn);
    if (!removing) void notifyPartner({ pairId, currentUid: uid, route: "home", action: "answer_reaction", title: `${myName} reacted ${emoji}`, body: "They reacted to your answer to today's question." });
  };

  const addSuggestion = async () => {
    const text = suggestion.trim();
    if (!text) return;
    if (suggestions.length >= MAX_SUGGESTIONS) { Alert.alert("The queue is full", "Use a few suggestions first, then add more."); return; }
    const item = makeSuggestion(text, uid);
    try {
      await updateDoc(pairRef, { questionSuggestions: arrayUnion(item) });
      setSuggestion("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void notifyPartner({ pairId, currentUid: uid, route: "home", action: "topic_suggested", title: `${myName} suggested a topic 💡`, body: "It'll show up as one of your next question cards." });
    } catch { Alert.alert("Couldn't save that", "Check your connection and try again."); }
  };

  const removeSuggestion = (item: Suggestion) => void updateDoc(pairRef, { questionSuggestions: arrayRemove(item) }).catch(console.warn);

  const continueInChat = () => {
    if (!picked) return;
    router.push({ pathname: "/chat", params: { draft: `About today's question, “${picked.text}”: ` } });
  };

  const meta = picked ? topicMeta(picked.topic) : null;

  return (
    <View style={s.card}>
      {!picked ? (
        <View style={s.pickArea}>
          <View style={s.pickHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>TODAY&apos;S QUESTION</Text>
              <Text style={s.pickTitle}>Pick a card for you both</Text>
              <Text style={s.pickHint}>Whoever picks first sets today&apos;s question.</Text>
            </View>
            <DeckArt size={58} colors={[t.accent, t.violet, t.mode === "dark" ? "rgba(255,255,255,0.18)" : "#EADFF0"]} />
          </View>
          <View style={s.deck}>
            {cards.map((card, index) => {
              const m = topicMeta(card.topic);
              const [bg, fg] = tone(card.topic);
              return (
                <Pressable key={`${card.topic}-${card.id ?? card.suggestion?.id}`} disabled={!!picking} onPress={() => pick(card)} style={({ pressed }) => [s.qCard, pressed && { transform: [{ scale: 0.97 }] }, picking === card.text && { opacity: 0.6 }]}>
                  {index === 0 && card.topic === "suggested" ? <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} /> : null}
                  <View style={[s.spine, { backgroundColor: fg }]} />
                  <View style={[s.glyph, { backgroundColor: bg }]}><TopicGlyph topic={card.topic} size={22} color={fg} /></View>
                  <View style={{ flex: 1 }}>
                    <View style={s.qTop}>
                      <Text style={[s.qTopic, { color: fg }]}>{m.label.toUpperCase()}</Text>
                      {card.suggestion && <Text style={s.qBy}>from {nameOf(card.suggestion.by)}</Text>}
                    </View>
                    <Text style={s.qText} numberOfLines={3}>{card.text}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <>
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <View pointerEvents="none" style={s.watermark}><TopicGlyph topic={picked.topic} size={132} color="rgba(255,255,255,0.16)" accent="rgba(255,255,255,0.22)" strokeWidth={1.2} /></View>
            <View style={s.heroTop}>
              <TopicGlyph topic={picked.topic} size={15} color="rgba(255,255,255,0.95)" accent="#fff" />
              <Text style={s.heroEyebrow}>TODAY&apos;S QUESTION · {meta?.label.toUpperCase()}</Text>
            </View>
            <Text style={s.question}>{picked.text}</Text>
            {!!picked.pickedBy && <Text style={s.heroMeta}>Picked by {nameOf(picked.pickedBy)}{picked.suggestedBy ? ` · suggested by ${nameOf(picked.suggestedBy)}` : ""}</Text>}
          </LinearGradient>

          <View style={s.body}>
            {!myAnswer ? (
              <>
                {!!partnerAnswer && <View style={s.notice}><SealedGlyph color={t.accentText} accent={t.accent} size={18} /><Text style={s.noticeText}>{partnerName} has answered. Answer to reveal theirs.</Text></View>}
                <View style={s.inputRow}>
                  <TextInput style={s.input} value={draft} onChangeText={setDraft} placeholder="Your answer…" placeholderTextColor={t.textMuted} selectionColor={t.accent} multiline maxLength={600} />
                  <Pressable accessibilityLabel="Send answer" onPress={send} disabled={!draft.trim() || sending} style={[s.send, !draft.trim() && { backgroundColor: t.surfacePressed }]}>
                    {!!draft.trim() && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
                    <SendGlyph color={draft.trim() ? "#fff" : t.textMuted} size={19} />
                  </Pressable>
                </View>
              </>
            ) : !bothAnswered ? (
              <>
                <Answer label="You" text={myAnswer} mine />
                <View style={s.waiting}><SealedGlyph color={t.textMuted} accent={t.accent} size={18} /><Text style={s.waitingText}>Waiting for {partnerName}. Answers reveal when you&apos;ve both answered.</Text></View>
              </>
            ) : (
              <Animated.View style={{ gap: 10, opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
                <Answer label={partnerName || "Partner"} text={partnerAnswer} reaction={reactions[uid]} />
                <View style={s.reactRow}>
                  {REACTIONS.map((emoji) => (
                    <Pressable key={emoji} onPress={() => react(emoji)} style={[s.reactBtn, reactions[uid] === emoji && s.reactActive]}>
                      <Text style={s.reactEmoji}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
                <Answer label="You" text={myAnswer} mine reaction={partnerUid ? reactions[partnerUid] : undefined} />
                <Button title="Continue in chat" icon={TalkGlyph} variant="secondary" size="sm" onPress={continueInChat} />
              </Animated.View>
            )}
          </View>
        </>
      )}

      <Pressable onPress={() => setSuggestOpen(true)} style={s.suggestLink}>
        <NoteGlyph color={t.accentText} accent={t.accent} size={17} />
        <Text style={s.suggestText}>Suggest a topic{suggestions.length ? ` · ${suggestions.length} queued` : ""}</Text>
      </Pressable>

      <Sheet visible={suggestOpen} onClose={() => setSuggestOpen(false)} eyebrow="SUGGEST A TOPIC" title="What should we talk about?">
        <Text style={s.sheetHint}>Suggestions become one of your next question cards, oldest first.</Text>
        <Field value={suggestion} onChangeText={setSuggestion} placeholder="How we want to spend Christmas" maxLength={140} multiline inputStyle={{ minHeight: 80 }} />
        <Button title="Add to the deck" onPress={addSuggestion} disabled={!suggestion.trim()} />
        {suggestions.length > 0 && <Text style={[s.sheetHint, { marginTop: 18 }]}>UP NEXT</Text>}
        {[...suggestions].sort((a, b) => a.at - b.at).map((item) => (
          <View key={item.id} style={s.queued}>
            <Text style={s.queuedText}>{item.text}</Text>
            <Text style={s.qBy}>{nameOf(item.by)}</Text>
            {item.by === uid && <Pressable accessibilityLabel="Remove suggestion" hitSlop={8} onPress={() => removeSuggestion(item)}><Trash2 color={t.textMuted} size={15} /></Pressable>}
          </View>
        ))}
      </Sheet>
    </View>
  );
}

function Answer({ label, text, mine, reaction }: { label: string; text: string; mine?: boolean; reaction?: string }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={[s.answer, { backgroundColor: mine ? t.violetSoft : t.accentSoft }]}>
      <Text style={[s.answerLabel, { color: mine ? t.violetText : t.accentText }]}>{label.toUpperCase()}</Text>
      <Text style={s.answerText}>{text}</Text>
      {!!reaction && <View style={s.reactionBadge}><Text style={{ fontSize: 14 }}>{reaction}</Text></View>}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: { borderRadius: 26, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, overflow: "hidden", marginBottom: 12, ...t.shadow },
  pickArea: { padding: 18, paddingBottom: 6 },
  pickHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  spine: { position: "absolute", left: 0, top: 12, bottom: 12, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  glyph: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  watermark: { position: "absolute", right: -18, bottom: -22 },
  eyebrow: { color: t.accentText, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  pickTitle: { color: t.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  pickHint: { color: t.textSecondary, fontSize: 13, marginTop: 3 },
  deck: { gap: 9, marginTop: 14 },
  qCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingLeft: 16, borderRadius: 18, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, overflow: "hidden" },
  qTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  qTopic: { color: t.textSecondary, fontSize: 10.5, fontWeight: "800", letterSpacing: 1 },
  qBy: { color: t.accentText, fontSize: 11.5, fontWeight: "700" },
  qText: { color: t.text, fontSize: 15.5, lineHeight: 21, fontWeight: "700" },
  hero: { padding: 18, paddingBottom: 20, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroEyebrow: { color: "rgba(255,255,255,0.92)", fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  question: { color: "#fff", fontSize: 20, lineHeight: 26, fontWeight: "800", letterSpacing: -0.3, marginTop: 10 },
  heroMeta: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginTop: 10 },
  body: { padding: 14, gap: 10 },
  notice: { flexDirection: "row", alignItems: "center", gap: 7, padding: 10, borderRadius: 12, backgroundColor: t.accentSoft },
  noticeText: { color: t.accentText, fontSize: 13, fontWeight: "700", flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, backgroundColor: t.surfaceSunken, borderRadius: 18, borderWidth: 1, borderColor: t.border, padding: 5, paddingLeft: 14 },
  input: { flex: 1, color: t.text, fontSize: 15, minHeight: 42, maxHeight: 120, paddingTop: 11, paddingBottom: 9 },
  send: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  answer: { padding: 12, borderRadius: 16 },
  answerLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1 },
  answerText: { color: t.text, fontSize: 15, lineHeight: 21, marginTop: 4 },
  reactionBadge: { position: "absolute", right: 8, bottom: -10, backgroundColor: t.surfaceRaised, borderRadius: 12, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: t.border },
  reactRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  reactBtn: { width: 42, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  reactActive: { backgroundColor: t.accentSoft, borderWidth: 1.5, borderColor: t.accent },
  reactEmoji: { fontSize: 19 },
  waiting: { flexDirection: "row", alignItems: "center", gap: 7, padding: 13, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.borderStrong },
  waitingText: { color: t.textMuted, fontSize: 13, fontWeight: "600", flex: 1 },
  suggestLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderTopWidth: 1, borderTopColor: t.border },
  suggestText: { color: t.accentText, fontSize: 13.5, fontWeight: "700" },
  sheetHint: { color: t.textSecondary, fontSize: 13.5, marginBottom: 12 },
  queued: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: t.border },
  queuedText: { flex: 1, color: t.text, fontSize: 14.5, fontWeight: "600" },
}));
