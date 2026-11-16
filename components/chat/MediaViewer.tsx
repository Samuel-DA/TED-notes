import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { X } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMediaUri } from "@/hooks/useMediaUri";
import type { ChatMedia } from "@/types/chat";

/** Full-screen photo/video viewer for chat and outfit posts. */
export default function MediaViewer({ media, caption, onClose }: { media: ChatMedia | null; caption?: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!media} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {media && (media.kind === "video" ? <VideoBody media={media} /> : <ImageBody media={media} />)}
        <Pressable accessibilityLabel="Close" onPress={onClose} hitSlop={12} style={[styles.close, { top: insets.top + 10 }]}>
          <X color="#fff" size={22} />
        </Pressable>
        {!!caption && <View style={[styles.caption, { paddingBottom: insets.bottom + 16 }]}><Text style={styles.captionText}>{caption}</Text></View>}
      </View>
    </Modal>
  );
}

function ImageBody({ media }: { media: ChatMedia }) {
  const { uri, error } = useMediaUri(media);
  if (error) return <Text style={styles.error}>Couldn&apos;t load this photo.</Text>;
  if (!uri) return <ActivityIndicator color="#fff" />;
  return <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />;
}

function VideoBody({ media }: { media: ChatMedia }) {
  const { uri, error } = useMediaUri(media);
  if (error) return <Text style={styles.error}>Couldn&apos;t load this video.</Text>;
  if (!uri) return <ActivityIndicator color="#fff" />;
  return <Player uri={uri} />;
}

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; p.play(); });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  close: { position: "absolute", right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  caption: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: "rgba(0,0,0,0.55)" },
  captionText: { color: "#fff", fontSize: 15.5, lineHeight: 22 },
  error: { color: "#fff", fontSize: 15 },
});
