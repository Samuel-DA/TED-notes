
import { db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { Brush, PenTool, Undo2, Trash2 } from "lucide-react-native";
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, PanResponder, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useGameStyles } from "./theme";
import { notifyGamePartner } from "./notify";

type Stroke = { id: string; uid: string; color: string; width: number; path: string };
type Props = { pairId: string | null; uid: string | null; myName: string; partnerName: string; onDrawingChange?: (drawing: boolean) => void };
const COLORS = ["#211A2C", "#B5445A", "#76527D", "#0B7A66", "#F59E0B", "#3B82F6"];
const MAX_STROKES = 220;

export default function DrawingActivity({ pairId, uid, myName, partnerName, onDrawingChange }: Props) {
  const t = useTheme();
  const styles = useStyles();
  const gameStyles = useGameStyles();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(COLORS[1]);
  const [width, setWidth] = useState(5);
  const pathRef = useRef("");

  const drawingRef = useMemo(() => pairId ? doc(db, "pairs", pairId, "games", "shared-drawing") : null, [pairId]);

  useEffect(() => {
    if (!drawingRef) return;
    return onSnapshot(drawingRef, (snapshot) => setStrokes(snapshot.data()?.strokes ?? []));
  }, [drawingRef]);

  const saveStroke = useCallback(async () => {
    if (!drawingRef || !uid || !pathRef.current) return;
    const stroke: Stroke = { id: doc(collection(db, "strokeIds")).id, uid, color, width, path: pathRef.current };
    pathRef.current = "";
    setDraft("");
    let startedNewDrawing = false;
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(drawingRef);
      const current: Stroke[] = snapshot.data()?.strokes ?? [];
      startedNewDrawing = current.length === 0;
      transaction.set(drawingRef, {
        strokes: [...current, stroke].slice(-MAX_STROKES),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    if (startedNewDrawing && pairId) await notifyGamePartner(pairId, uid, "A drawing is waiting 🎨", `${myName} started something for you on your shared canvas.`);
  }, [color, drawingRef, myName, pairId, uid, width]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) => {
      onDrawingChange?.(true);
      const { locationX, locationY } = event.nativeEvent;
      pathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
      setDraft(pathRef.current);
    },
    onPanResponderMove: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      pathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
      setDraft(pathRef.current);
    },
    onPanResponderRelease: () => { onDrawingChange?.(false); void saveStroke(); },
    onPanResponderTerminate: () => { onDrawingChange?.(false); void saveStroke(); },
  }), [onDrawingChange, saveStroke]);

  useEffect(() => () => onDrawingChange?.(false), [onDrawingChange]);

  const undo = async () => {
    if (!drawingRef) return;
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(drawingRef);
      const current: Stroke[] = snapshot.data()?.strokes ?? [];
      if (!current.length) return;
      transaction.set(drawingRef, {
        strokes: current.slice(0, -1),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  };

  const clearCanvas = () => {
    if (!drawingRef || !strokes.length) return;
    Alert.alert("Clear shared canvas?", "This removes every stroke for both of you.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear canvas", style: "destructive", onPress: async () => {
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(drawingRef);
          transaction.set(drawingRef, { strokes: [], updatedAt: serverTimestamp() }, { merge: true });
          return snapshot.exists();
        });
      } },
    ]);
  };

  return (
    <View style={gameStyles.card}>
      <View style={gameStyles.titleRow}>
        <View style={styles.icon}><Brush color={t.accentText} size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={gameStyles.title}>Draw Together</Text>
          <Text style={styles.caption}>A live canvas shared with {partnerName}. Draw a clue, finish a doodle, or leave a tiny picture.</Text>
        </View>
      </View>
      <View style={styles.toolbar}>
        {COLORS.map((item) => <Pressable accessibilityLabel={`Use ${item}`} key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item }, color === item && styles.swatchActive]} />)}
        <Pressable onPress={() => setWidth((current) => current === 5 ? 10 : 5)} style={styles.toolButton}><PenTool color={t.violetText} size={16} /><Text style={styles.toolText}>{width === 5 ? "Fine" : "Bold"}</Text></Pressable>
      </View>
      <View style={styles.actionToolbar}>
        <Pressable accessibilityLabel="Undo last stroke" disabled={!strokes.length} onPress={undo} style={[styles.undoButton, !strokes.length && styles.undoDisabled]}><Undo2 color={t.violetText} size={16} /><Text style={styles.undoText}>Undo</Text></Pressable>
        <Pressable accessibilityLabel="Clear shared canvas" disabled={!strokes.length} onPress={clearCanvas} style={[styles.undoButton, styles.clearButton, !strokes.length && styles.undoDisabled]}><Trash2 color={t.accentText} size={15} /><Text style={styles.undoText}>Clear</Text></Pressable>
      </View>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <View pointerEvents="none" style={styles.canvasLayer}>
          <Svg width="100%" height="100%">
            {strokes.map((stroke) => <Path key={stroke.id} d={stroke.path} stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
            {!!draft && <Path d={draft} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          </Svg>
        </View>
        {!strokes.length && !draft && <View pointerEvents="none" style={styles.blank}><Brush color={t.textMuted} size={36} /><Text style={styles.blankTitle}>Start with one line</Text><Text style={styles.blankText}>Your partner will see it appear after you lift your finger.</Text></View>}
      </View>
      <Text style={styles.syncText}>Live shared canvas · newest {MAX_STROKES} strokes are kept</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center", marginRight: 10 },
  caption: { color: t.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 8 },
  swatch: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: t.surface },
  swatchActive: { borderColor: t.text, transform: [{ scale: 1.12 }] },
  toolButton: { marginLeft: "auto", height: 34, paddingHorizontal: 10, borderRadius: 12, backgroundColor: t.surfaceSunken, flexDirection: "row", gap: 5, alignItems: "center" },
  toolText: { color: t.violetText, fontSize: 11, fontWeight: "800" },
  actionToolbar: { flexDirection: "row", gap: 8, marginBottom: 10 },
  undoButton: { flex: 1, height: 36, paddingHorizontal: 9, borderRadius: 12, backgroundColor: t.surfaceSunken, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center" },
  clearButton: { backgroundColor: t.accentSoft },
  undoText: { color: t.violetText, fontSize: 10.5, fontWeight: "900" },
  undoDisabled: { opacity: 0.38 },
  canvas: { height: 360, borderRadius: 20, overflow: "hidden", backgroundColor: "#FFFDFB", borderWidth: 1, borderColor: t.border },
  canvasLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  blank: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 45 },
  blankTitle: { color: t.text, fontSize: 17, fontWeight: "800", marginTop: 8 },
  blankText: { color: t.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 4 },
  syncText: { color: t.textSecondary, fontSize: 10, textAlign: "center", marginTop: 10 },
}));
