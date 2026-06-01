import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  // --- Bubbles ---
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 18,
    marginVertical: 4,
    borderRadius: 20,
    position: "relative",
  },
myBubble: {
  backgroundColor: "#6366f1",
  alignSelf: "flex-end",
  borderBottomRightRadius: 4,
},

theirBubble: {
  backgroundColor: "#e5e7eb",
  alignSelf: "flex-start",
  borderBottomLeftRadius: 4,
},

  messageText: { fontSize: 16, lineHeight: 20, color: "#fff", paddingRight: 60 },
  theirText: { color: "#111827" },

  timeSeenRow: { position: "absolute", right: 8, bottom: 4, flexDirection: "row", alignItems: "center" },
  time: { fontSize: 11 },
  myTime: { color: "#e0e7ff" },
  theirTime: { color: "#374151" },
  seen: { fontSize: 11, color: "#e0e7ff", marginLeft: 4 },

  replyPreview: { borderLeftWidth: 3, borderLeftColor: "#e0e7ff", paddingLeft: 6, marginBottom: 4 },
  replyText: { fontSize: 13, color: "#e0e7ff" },

  reactionBubble: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    alignItems: "center",
    borderRadius: 12,
  },
  reactionCount: { fontSize: 12, color: "#111" },

  reactionPicker: { flexDirection: "row", backgroundColor: "#fff", padding: 8, borderRadius: 20, alignSelf: "center", marginBottom: 6, elevation: 6 },
  reactionEmoji: { fontSize: 22, marginHorizontal: 6 },

  reactionOverlay: { left: 10, bottom: -10, flexDirection: "row" ,position: "absolute", borderRadius: 8, paddingHorizontal: 3, paddingVertical: 3 },


  bottomStack: { paddingHorizontal: 12, paddingBottom: 14 },
  replyBar: { backgroundColor: "#e5e7eb", padding: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12, flexDirection: "row", justifyContent: "space-between" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8, elevation: 8 },
  input: { flex: 1, marginHorizontal: 8, fontSize: 16, maxHeight: 120, color: "#111827" },
  sendButton: { backgroundColor: "#6366f1", borderRadius: 18, padding: 10 },
});