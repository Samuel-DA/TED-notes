import { Image } from "expo-image";
import { ImageOff, Play } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useMediaUri } from "@/hooks/useMediaUri";
import type { ChatMedia } from "@/types/chat";

/** Inline preview of a chat photo/video. Tapping opens the full-screen viewer. */
export default function MediaThumb({ media, onPress, onLongPress, maxWidth = 240 }: { media: ChatMedia; onPress: () => void; onLongPress?: () => void; maxWidth?: number }) {
  const ratio = media.width && media.height ? media.width / media.height : 1;
  const width = maxWidth;
  const height = Math.max(120, Math.min(320, width / Math.max(0.55, Math.min(ratio, 1.8))));
  const isVideo = media.kind === "video";
  const { uri, error } = useMediaUri(media, !isVideo);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={280} accessibilityRole="imagebutton" accessibilityLabel={isVideo ? "Open video" : "Open photo"} style={({ pressed }) => [{ width, height }, styles.box, pressed && { opacity: 0.85 }]}>
      {isVideo ? (
        <View style={styles.video}>
          <View style={styles.play}><Play color="#fff" fill="#fff" size={22} /></View>
          {!!media.duration && <Text style={styles.duration}>{Math.floor(media.duration / 60)}:{String(Math.round(media.duration % 60)).padStart(2, "0")}</Text>}
        </View>
      ) : error ? (
        <View style={styles.center}><ImageOff color="#fff" size={22} /></View>
      ) : uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.center}><ActivityIndicator color="#fff" /></View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, overflow: "hidden", backgroundColor: "#2A2130" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  video: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1C1622" },
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  duration: { position: "absolute", right: 10, bottom: 8, color: "#fff", fontSize: 12, fontWeight: "700", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: "hidden" },
});
