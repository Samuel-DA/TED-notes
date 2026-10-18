import { MessageCircleHeart } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const CARDS = [
  { category: "Us", text: "What is one small moment with me that you still think about?" },
  { category: "Dream", text: "If we could wake up anywhere tomorrow, where would it be?" },
  { category: "Appreciation", text: "What have I done recently that made you feel loved?" },
  { category: "Fun", text: "Which fictional couple would be the funniest version of us?" },
  { category: "Growth", text: "What is one habit we could build that would make us stronger?" },
  { category: "Memory", text: "What did you first notice about me?" },
  { category: "Future", text: "Describe an ordinary day in our ideal future life." },
  { category: "Affection", text: "When do you feel closest to me?" },
  { category: "Adventure", text: "What should we try together at least once?" },
  { category: "Support", text: "What is one thing I can make easier for you this week?" },
  { category: "Laugh", text: "What is our funniest shared memory?" },
  { category: "Faith", text: "What is something you would like us to pray about together?" },
  { category: "Home", text: "What makes a place feel like home when we are together?" },
  { category: "Honesty", text: "What do you wish we made more time for?" },
  { category: "Date", text: "Plan our perfect low-budget date in three steps." },
] as const;

export default function ConversationCards() {
  const [index, setIndex] = useState(() => new Date().getDate() % CARDS.length);
  const [seen, setSeen] = useState<number[]>([]);
  const card = CARDS[index];

  const nextCard = () => {
    const unavailable = new Set([...seen, index]);
    if (unavailable.size >= CARDS.length) unavailable.clear();

    let next = Math.floor(Math.random() * CARDS.length);
    while (unavailable.has(next)) next = (next + 1) % CARDS.length;
    setSeen(Array.from(unavailable));
    setIndex(next);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MessageCircleHeart color="#fff" size={30} />
        </View>
        <Text style={styles.category}>{card.category}</Text>
        <Text style={styles.question}>{card.text}</Text>
        <Text style={styles.tip}>Take turns answering. Ask “why?” once before moving on.</Text>
      </View>
      <Pressable style={styles.button} onPress={nextCard}>
        <Text style={styles.buttonText}>Draw another card</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 16 },
  card: {
    minHeight: 310,
    borderRadius: 26,
    padding: 26,
    backgroundColor: "#312e81",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  category: {
    color: "#f9a8d4",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "900",
  },
  question: {
    color: "#fff",
    fontSize: 23,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 18,
  },
  tip: { color: "#c7d2fe", textAlign: "center", fontSize: 12, lineHeight: 18 },
  button: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
  },
  buttonText: { color: "#4c1d95", fontWeight: "900", textAlign: "center" },
});
