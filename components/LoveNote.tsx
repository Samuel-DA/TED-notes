import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  title: string; 
  note: string;
  timestamp?: number; 
  setNote?: (n: string) => void;
  saveNote?: () => void;
  readOnly?: boolean;
  compact?: boolean;
};

export default function LoveNote({
  title,
  note,
  timestamp, 
  setNote,
  saveNote,
  readOnly = false,
  compact = false,
}: Props) {
  const [editing, setEditing] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: editing ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: editing ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [editing, fadeAnim, slideAnim]);

  // 👑 HUMANIZED RELATIVE TIMESTAMP GENERATOR
  const formatNoteTime = (epoch?: number) => {
    if (!epoch) return "";

    const target = new Date(epoch);
    const now = new Date();
    
    // Clear out hours/minutes to get clean calendar day differences
    const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowDateOnly.getTime() - targetDateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Format the time snippet (e.g., "10:01 AM")
    const timeString = target.toLocaleTimeString([], { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });

    if (diffDays === 0) {
      return `Today at ${timeString}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${timeString}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      // Fallback for notes older than a week
      return target.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.headerContainerRow, compact && styles.headerCompact]}>
        <Text numberOfLines={compact ? 2 : undefined} style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        
        {/* Render relative display line */}
        {timestamp && note.trim() !== "" && (
          <Text numberOfLines={1} style={[styles.timestampText, compact && styles.timestampCompact]}>{formatNoteTime(timestamp)}</Text>
        )}
      </View>

      {!editing && (
        <>
          <Text numberOfLines={compact ? 5 : undefined} style={[styles.text, compact && styles.textCompact]}>
            {note || (readOnly ? "No note yet 💭" : "Write something…")}
          </Text>

          {!readOnly && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {!readOnly && editing && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Write something meaningful…"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            autoFocus
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              saveNote?.();
              setEditing(false);
              Keyboard.dismiss();
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },
  cardCompact: { padding: 14, marginBottom: 0, minHeight: 168 },
  headerContainerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCompact: { alignItems: "flex-start", flexDirection: "column" },
  title: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#fff",
    flex: 1,
  },
  titleCompact: { fontSize: 15.5 },
  timestampText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.52)",
    marginLeft: 8,
  },
  timestampCompact: { marginLeft: 0, marginTop: 3, fontSize: 10.5 },
  text: { marginTop: 8, color: "rgba(255,255,255,0.76)", fontSize: 15, lineHeight: 22 },
  textCompact: { fontSize: 13.5, lineHeight: 20 },
  editBtn: { marginTop: 10, color: "#F0B9C4", fontWeight: "700" },
  input: {
    marginTop: 12,
    fontSize: 16,
    color: "#111827",
    lineHeight: 22,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    maxHeight: 140,
  },
  saveBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: "#B5445A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
