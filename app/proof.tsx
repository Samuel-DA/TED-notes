import { Image } from "expo-image";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Shirt } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import MediaViewer from "@/components/chat/MediaViewer";
import { EmptyState, Screen } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { ProofPost } from "@/hooks/useProofOfLife";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useStorageFile } from "@/services/media";
import { fromKey } from "@/utils/dayKey";

export default function ProofWall() {
  const { pairId, uid, partnerName, resumeKey } = useApp();
  const s = useStyles();
  const t = useTheme();
  const [posts, setPosts] = useState<ProofPost[] | null>(null);
  const [viewing, setViewing] = useState<ProofPost | null>(null);

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(query(collection(db, "pairs", pairId, "proofOfLife"), orderBy("createdAt", "desc"), limit(120)), (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProofPost));
    }, () => setPosts([]));
  }, [pairId, resumeKey]);

  const days = useMemo(() => {
    const map = new Map<string, { mine?: ProofPost; theirs?: ProofPost }>();
    (posts || []).forEach((p) => {
      const entry = map.get(p.date) || {};
      if (p.ownerUid === uid) entry.mine = p; else entry.theirs = p;
      map.set(p.date, entry);
    });
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [posts, uid]);

  return (
    <Screen bottom="safe">
      <AppHeader back eyebrow="OUTFIT OF THE DAY" title="Your wall" subtitle={`Every day you and ${partnerName || "your partner"} showed up.`} icon={<Shirt color="#fff" size={22} />} />
      {posts === null ? <ActivityIndicator color={t.accent} style={{ marginTop: 30 }} /> : !days.length ? (
        <EmptyState icon={Shirt} title="No outfits yet" body="Post today's look from Home. Your daily photos will build up here." />
      ) : days.map(([date, entry]) => (
        <View key={date} style={s.day}>
          <Text style={s.date}>{fromKey(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</Text>
          <View style={s.row}>
            <Thumb post={entry.theirs} label={partnerName || "Partner"} onPress={() => entry.theirs && setViewing(entry.theirs)} />
            <Thumb post={entry.mine} label="You" onPress={() => entry.mine && setViewing(entry.mine)} />
          </View>
        </View>
      ))}
      <MediaViewer media={viewing ? { path: viewing.storagePath, kind: "image", mimeType: "image/jpeg", width: viewing.width, height: viewing.height } : null} caption={viewing?.caption} onClose={() => setViewing(null)} />
    </Screen>
  );
}

function Thumb({ post, label, onPress }: { post?: ProofPost; label: string; onPress: () => void }) {
  const s = useStyles();
  const { uri } = useStorageFile(post?.storagePath);
  return (
    <Pressable disabled={!post} onPress={onPress} style={({ pressed }) => [s.thumb, !post && s.thumbEmpty, pressed && { opacity: 0.85 }]}>
      {post && uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} /> : null}
      {!post && <Text style={s.missing}>—</Text>}
      <View style={s.pill}><Text style={s.pillText}>{label}{post?.reaction ? ` ${post.reaction}` : ""}</Text></View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  day: { marginBottom: 18 },
  date: { color: t.textSecondary, fontSize: 13, fontWeight: "700", marginBottom: 8, marginLeft: 2 },
  row: { flexDirection: "row", gap: 10 },
  thumb: { flex: 1, aspectRatio: 0.8, borderRadius: 18, overflow: "hidden", backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
  thumbEmpty: { borderWidth: 1, borderStyle: "dashed", borderColor: t.borderStrong },
  missing: { color: t.textMuted, fontSize: 18 },
  pill: { position: "absolute", left: 8, bottom: 8, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)" },
  pillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
}));
