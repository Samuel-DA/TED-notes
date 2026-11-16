import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { Camera, ChevronRight, ImageIcon, RefreshCw, Shirt, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Field, Sheet } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { ProofPost, useProofOfLife } from "@/hooks/useProofOfLife";
import { useStorageFile } from "@/services/media";

const REACTIONS = ["😍", "🔥", "🥰", "😂", "👏", "💯"];

export default function OutfitOfTheDay({ partnerUid, partnerName }: { partnerUid: string | null; partnerName: string }) {
  const t = useTheme();
  const s = useStyles();
  const router = useRouter();
  const { mine, theirs, busy, post, updateCaption, react, remove } = useProofOfLife(partnerUid);
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<"mine" | "theirs" | null>(null);
  const [caption, setCaption] = useState("");

  const choose = async (source: "camera" | "library") => {
    setAddOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 350));
    try { await post(source, caption); setCaption(""); }
    catch (error) { Alert.alert("Couldn't post your photo", error instanceof Error ? error.message : "Try again."); }
  };

  const confirmRemove = () => Alert.alert("Remove today's photo?", "It will disappear for both of you.", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => { setViewing(null); void remove(); } },
  ]);

  const open = viewing === "mine" ? mine : viewing === "theirs" ? theirs : null;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.icon}><Shirt color={t.accentText} size={18} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>OUTFIT OF THE DAY</Text>
          <Text style={s.title}>{mine && theirs ? "You both checked in 📸" : "Proof of life"}</Text>
        </View>
        <Pressable onPress={() => router.push("/proof" as Href)} hitSlop={8} style={s.all}>
          <Text style={s.allText}>All</Text>
          <ChevronRight color={t.accentText} size={16} />
        </Pressable>
      </View>

      <View style={s.row}>
        <Tile label={partnerName || "Partner"} post={theirs} emptyText={`Waiting for ${partnerName || "them"}`} onPress={() => theirs && setViewing("theirs")} />
        <Tile label="You" post={mine} busy={busy} emptyText="Add yours" onPress={() => (mine ? setViewing("mine") : setAddOpen(true))} mine />
      </View>

      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} eyebrow="OUTFIT OF THE DAY" title="Show them today's look">
        <Field value={caption} onChangeText={setCaption} placeholder="Add a caption (optional)" maxLength={140} />
        <Button title="Take a photo" icon={Camera} onPress={() => void choose("camera")} />
        <Button title="Choose from library" icon={ImageIcon} variant="secondary" onPress={() => void choose("library")} style={{ marginTop: 10 }} />
      </Sheet>

      <Sheet visible={!!open} onClose={() => setViewing(null)} eyebrow={viewing === "mine" ? "YOUR OUTFIT" : `${(partnerName || "PARTNER").toUpperCase()}'S OUTFIT`} title={open?.createdAt?.toDate?.().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "Today"}>
        {open && <BigImage post={open} />}
        {!!open?.caption && <Text style={s.caption}>{open.caption}</Text>}
        {viewing === "theirs" && theirs && (
          <View style={s.reactRow}>
            {REACTIONS.map((emoji) => (
              <Pressable key={emoji} onPress={() => void react(emoji)} style={[s.reactBtn, theirs.reaction === emoji && s.reactActive]}>
                <Text style={s.reactEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {viewing === "mine" && mine && (
          <>
            {!!mine.reaction && <Text style={s.gotReaction}>{partnerName || "They"} reacted {mine.reaction}</Text>}
            <Field value={caption || mine.caption} onChangeText={setCaption} placeholder="Caption" maxLength={140} style={{ marginTop: 14 }} onEndEditing={() => caption && void updateCaption(caption)} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button title="Retake" icon={RefreshCw} variant="secondary" style={{ flex: 1 }} onPress={() => { setViewing(null); setAddOpen(true); }} />
              <Button title="Remove" icon={Trash2} variant="danger" style={{ flex: 1 }} onPress={confirmRemove} />
            </View>
          </>
        )}
      </Sheet>
    </View>
  );
}

function Tile({ label, post, emptyText, onPress, mine, busy }: { label: string; post: ProofPost | null; emptyText: string; onPress: () => void; mine?: boolean; busy?: boolean }) {
  const t = useTheme();
  const s = useStyles();
  const { uri } = useStorageFile(post?.storagePath);
  return (
    <Pressable onPress={onPress} disabled={!post && !mine} style={({ pressed }) => [s.tile, !post && s.tileEmpty, pressed && { transform: [{ scale: 0.97 }] }]}>
      {post && uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : null}
      {busy ? <ActivityIndicator color={t.accent} /> : !post ? (
        <View style={s.emptyInner}>
          {mine ? <Camera color={t.accentText} size={26} /> : <Text style={{ fontSize: 26 }}>⏳</Text>}
          <Text style={[s.emptyText, mine && { color: t.accentText }]}>{emptyText}</Text>
        </View>
      ) : !uri ? <ActivityIndicator color={t.accent} /> : null}
      <View style={s.labelPill}><Text style={s.labelText}>{label}{post?.reaction ? ` ${post.reaction}` : ""}</Text></View>
    </Pressable>
  );
}

function BigImage({ post }: { post: ProofPost }) {
  const s = useStyles();
  const t = useTheme();
  const { uri } = useStorageFile(post.storagePath);
  const ratio = post.width && post.height ? post.width / post.height : 0.75;
  return (
    <View style={[s.big, { aspectRatio: Math.max(0.6, Math.min(ratio, 1.4)) }]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : <ActivityIndicator color={t.accent} />}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: { padding: 16, borderRadius: 24, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginBottom: 12, ...t.shadow },
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  icon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: t.accentSoft },
  eyebrow: { color: t.textMuted, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: t.text, fontSize: 17, fontWeight: "800", marginTop: 2 },
  all: { flexDirection: "row", alignItems: "center", gap: 2 },
  allText: { color: t.accentText, fontSize: 13.5, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, aspectRatio: 0.78, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  tileEmpty: { borderWidth: 1.5, borderStyle: "dashed", borderColor: t.borderStrong },
  emptyInner: { alignItems: "center", gap: 8, paddingHorizontal: 10 },
  emptyText: { color: t.textMuted, fontSize: 13, fontWeight: "700", textAlign: "center" },
  labelPill: { position: "absolute", left: 8, bottom: 8, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)" },
  labelText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  big: { width: "100%", borderRadius: 20, overflow: "hidden", backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
  caption: { color: t.text, fontSize: 16, lineHeight: 22, marginTop: 12 },
  reactRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  reactBtn: { width: 48, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  reactActive: { backgroundColor: t.accentSoft, borderWidth: 1.5, borderColor: t.accent },
  reactEmoji: { fontSize: 22 },
  gotReaction: { color: t.accentText, fontSize: 14, fontWeight: "700", marginTop: 12 },
}));
