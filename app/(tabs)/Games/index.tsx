// app/(tabs)/Games/index.tsx
import * as Haptics from "expo-haptics";
import { ArrowLeft, Gamepad2, Trophy } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "@/components/AppHeader";
import ConversationCards from "@/components/games/ConversationCards";
import DrawingActivity from "@/components/games/DrawingActivity";
import GuessGame from "@/components/games/GuessGame";
import KnowMeGame from "@/components/games/KnowMeGame";
import MemoryMatch from "@/components/games/MemoryMatch";
import ReactionRace from "@/components/games/ReactionRace";
import Scoreboard from "@/components/games/ScoreBoard";
import ThisOrThatGame from "@/components/games/ThisOrThatGame";
import { useTabBarSpace } from "@/components/SleekTabBar";
import { ScreenBackground } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type GameType = "memory" | "reaction" | "draw" | "guess" | "knowme" | "thisorthat" | "cards";
type Tone = "accent" | "violet" | "success" | "warning" | "info";

const GAMES: { id: GameType; label: string; emoji: string; blurb: string; tone: Tone }[] = [
  { id: "knowme", label: "Know me", emoji: "🧠", blurb: "How well do you really know each other?", tone: "violet" },
  { id: "thisorthat", label: "This or that", emoji: "↔️", blurb: "Quick picks, see where you match", tone: "accent" },
  { id: "guess", label: "Guess", emoji: "🎯", blurb: "Set a secret, they guess it", tone: "warning" },
  { id: "memory", label: "Memory", emoji: "🧩", blurb: "Race to match the pairs", tone: "success" },
  { id: "reaction", label: "Reflex", emoji: "⚡", blurb: "Who's quicker on the tap?", tone: "info" },
  { id: "draw", label: "Draw together", emoji: "🎨", blurb: "A live canvas for two", tone: "accent" },
  { id: "cards", label: "Talk cards", emoji: "💬", blurb: "Prompts for deeper conversation", tone: "violet" },
];

export default function Games() {
  const { pairId, myName, uid, partnerName } = useApp();
  const t = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [active, setActive] = useState<GameType | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const tones: Record<Tone, string> = { accent: t.accentSoft, violet: t.violetSoft, success: t.successSoft, warning: t.warningSoft, info: t.infoSoft };
  const game = GAMES.find((g) => g.id === active);

  const open = (id: GameType) => { void Haptics.selectionAsync(); setActive(id); };

  return (
    <ScreenBackground>
      <ScrollView scrollEnabled={!isDrawing} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: tabSpace + 28 }}>
        <View style={{ paddingHorizontal: 16 }}>
          {!game ? (
            <AppHeader eyebrow="PLAYSPACE" title="Closer through play" subtitle={`Live games and prompts for you and ${partnerName || "your partner"}.`} icon={<Gamepad2 color="#fff" size={22} />} />
          ) : (
            <View style={s.gameHead}>
              <Pressable accessibilityLabel="All games" onPress={() => setActive(null)} style={s.back}><ArrowLeft color={t.text} size={20} /></Pressable>
              <View style={[s.gameEmojiBox, { backgroundColor: tones[game.tone] }]}><Text style={s.gameEmoji}>{game.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.gameTitle}>{game.label}</Text>
                <Text style={s.gameBlurb} numberOfLines={1}>{game.blurb}</Text>
              </View>
            </View>
          )}
        </View>

        {!game && (
          <View style={s.grid}>
            {GAMES.map((item, index) => (
              <Pressable key={item.id} onPress={() => open(item.id)} style={({ pressed }) => [s.tile, index === 0 && s.tileWide, pressed && { transform: [{ scale: 0.97 }] }]}>
                <View style={[s.emojiBox, { backgroundColor: tones[item.tone] }, index === 0 && { marginBottom: 0 }]}><Text style={s.emoji}>{item.emoji}</Text></View>
                <View style={index === 0 ? { flex: 1 } : undefined}>
                  <Text style={s.tileTitle}>{item.label}</Text>
                  <Text style={s.tileBlurb} numberOfLines={2}>{item.blurb}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {active === "guess" && <GuessGame pairId={pairId} myName={myName || "You"} partnerName={partnerName || ""} />}
        {active === "knowme" && <KnowMeGame pairId={pairId} myName={myName || "You"} partnerName={partnerName || ""} />}
        {active === "thisorthat" && <ThisOrThatGame pairId={pairId} uid={uid} myName={myName || "Your partner"} partnerName={partnerName || ""} />}
        {active === "cards" && <ConversationCards />}
        {active === "memory" && <MemoryMatch pairId={pairId} uid={uid} myName={myName || "You"} partnerName={partnerName || ""} />}
        {active === "reaction" && <ReactionRace pairId={pairId} uid={uid} myName={myName || "You"} partnerName={partnerName || ""} />}
        {active === "draw" && <DrawingActivity pairId={pairId} uid={uid} myName={myName || "You"} partnerName={partnerName || ""} onDrawingChange={setIsDrawing} />}

        {active !== "draw" && active !== "cards" && (
          <>
            {!game && <View style={s.scoreHead}><Trophy color={t.warningText} size={18} /><Text style={s.scoreTitle}>Scoreboard</Text></View>}
            <Scoreboard pairId={pairId} />
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  tile: { width: "48%", flexGrow: 1, minHeight: 148, padding: 16, borderRadius: 24, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow },
  tileWide: { width: "100%", minHeight: 0, flexDirection: "row", alignItems: "center", gap: 14 },
  emojiBox: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emoji: { fontSize: 26 },
  tileTitle: { color: t.text, fontSize: 16, fontWeight: "800" },
  tileBlurb: { color: t.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  gameHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4, minHeight: 56 },
  back: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  gameEmojiBox: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  gameEmoji: { fontSize: 24 },
  gameTitle: { color: t.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  gameBlurb: { color: t.textSecondary, fontSize: 13, marginTop: 1 },
  scoreHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, marginTop: 24 },
  scoreTitle: { color: t.text, fontSize: 17, fontWeight: "800" },
}));
