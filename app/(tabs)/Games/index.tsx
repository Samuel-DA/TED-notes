import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Game = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  route: "/(tabs)/Games/GuessGame" | "/(tabs)/Games/KnowMeGame";
  disabled?: boolean;
};

const GAMES: Game[] = [
  {
    id: "guess",
    title: "Guess the Meaning",
    subtitle: "What does it stand for?",
    emoji: "🎯",
    route: "/(tabs)/Games/GuessGame",
  },
  {
    id: "knowme",
    title: "Know Me",
    subtitle: "How well do you know your partner?",
    emoji: "🧠",
    route: "/(tabs)/Games/KnowMeGame",
    disabled: true,
  },
];

export default function Games() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#c084fc", "#f472b6"]} style={styles.container}>
      <Text style={styles.title}>🎮 Games</Text>
      <Text style={styles.subtitle}>
        Play together, earn points, have fun 💜
      </Text>

      {GAMES.map((game) => (
        <TouchableOpacity
          key={game.id}
          disabled={game.disabled}
          style={[styles.card, game.disabled && styles.disabled]}
          onPress={() =>
            !game.disabled && router.push({ pathname: game.route })
          }
        >
          <Text style={styles.emoji}>{game.emoji}</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
          </View>

          {game.disabled && <Text style={styles.soon}>Soon</Text>}
        </TouchableOpacity>
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 34, fontWeight: "800", color: "#fff", marginTop: 40 },
  subtitle: { marginTop: 6, marginBottom: 24, fontSize: 16, color: "#fce7f3" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  disabled: { opacity: 0.5 },
  emoji: { fontSize: 36, marginRight: 16 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  cardSubtitle: { marginTop: 2, fontSize: 14, color: "#6b7280" },
  soon: { fontSize: 12, color: "#4f46e5", fontWeight: "700" },
});
