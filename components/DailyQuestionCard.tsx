import { Send } from "lucide-react-native";
import React from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { palette } from "@/constants/design";

interface DailyQuestionCardProps {
  dailyQuestion: { question: string } | null; // Adjusted to match custom epoch routine schema
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  typedAnswer: string;
  setTypedAnswer: (v: string) => void;
  myAnswer: string;
  partnerAnswer: string;
  partnerName: string;
  onSave: () => void;
}

export default function DailyQuestionCard({
  dailyQuestion,
  scaleAnim,
  fadeAnim,
  typedAnswer,
  setTypedAnswer,
  myAnswer,
  partnerAnswer,
  partnerName,
  onSave,
}: DailyQuestionCardProps) {
  if (!dailyQuestion) return null;

  return (
    <Animated.View
      style={{
        padding: 18,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.90)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.38)",
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 24, // Added bottom safe padding buffer spacing
      }}
    >
      <Text
        style={{
          color: palette.rose,
          fontSize: 13,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 4,
        }}
      >
        💬 Daily Question Prompt
      </Text>

      <Text
        style={{
          color: "#1f2937",
          fontSize: 16,
          fontWeight: "700",
          lineHeight: 22,
          marginBottom: 12,
        }}
      >
        {dailyQuestion.question}
      </Text>

      {/* WORKSPACE MODE A: SUBMISSION BOX */}
      {!myAnswer && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#f3f4f6",
            borderRadius: 14,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              minHeight: 40,
              color: "#111827",
              fontSize: 14,
              paddingVertical: 8,
            }}
            value={typedAnswer}
            onChangeText={setTypedAnswer}
            placeholder="Type your answer to unlock theirs..."
            placeholderTextColor="#9ca3af"
            multiline={false}
          />
          <Pressable
            onPress={onSave}
            disabled={!typedAnswer.trim()}
            hitSlop={15}
            style={{
              padding: 8,
              backgroundColor: typedAnswer.trim() ? palette.rose : "#d1d5db",
              borderRadius: 10,
              marginLeft: 6,
            }}
          >
            <Send size={14} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* WORKSPACE MODE B: REVIEW RESPONSES */}
      {myAnswer.length > 0 && (
        <View style={{ gap: 10, marginTop: 4 }}>
          <View
            style={{
              backgroundColor: "#f3e8ff",
              padding: 10,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#a855f7",
                marginBottom: 2,
              }}
            >
              YOUR ANSWER
            </Text>
            <Text style={{ fontSize: 14, color: "#4b5563" }}>{myAnswer}</Text>
          </View>

          <View
            style={{
              backgroundColor: "#f3f4f6",
              padding: 10,
              borderRadius: 12,
              borderStyle: partnerAnswer ? "solid" : "dashed",
              borderWidth: partnerAnswer ? 0 : 1,
              borderColor: "#d1d5db",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#6b7280",
                marginBottom: 2,
              }}
            >
              {partnerName.toUpperCase() || "PARTNER"}&apos;S ANSWER
            </Text>

            {!partnerAnswer ? (
              <Text
                style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}
              >
                Waiting for them to answer... ⏳
              </Text>
            ) : (
              <Text
                style={{ fontSize: 14, color: "#1f2937", fontWeight: "500" }}
              >
                {partnerAnswer}
              </Text>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}
