// Bespoke line glyphs for Today's question — drawn for TED Space, not from an icon library.
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { QuestionCard } from "@/utils/questionDeck";

type GlyphProps = { size?: number; color?: string; accent?: string; strokeWidth?: number };
const base = (size: number, children: React.ReactNode) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>
);

/** Us — two interlocked rings with a heart where they meet. */
export const UsGlyph = ({ size = 20, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Circle cx={8.6} cy={12} r={5.4} stroke={color} strokeWidth={strokeWidth} />
  <Circle cx={15.4} cy={12} r={5.4} stroke={color} strokeWidth={strokeWidth} />
  <Path d="M12 14.3l-1.7-1.6a1.05 1.05 0 0 1 1.7-1.25a1.05 1.05 0 0 1 1.7 1.25z" fill={accent ?? color} />
</>);

/** Deep — sonar arcs sinking toward a single point. */
export const DeepGlyph = ({ size = 20, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Path d="M3.5 7.5c5.4-4 11.6-4 17 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Path d="M6.2 11.2c3.6-2.6 8-2.6 11.6 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Path d="M8.8 14.8c2-1.4 4.4-1.4 6.4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Circle cx={12} cy={19} r={1.6} fill={accent ?? color} />
</>);

/** Fun — a scatter of confetti: a zigzag, a ring, a spark and a little triangle. */
export const FunGlyph = ({ size = 20, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Path d="M3.5 8.5l2.2-2.2l2.2 2.2l2.2-2.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  <Circle cx={17.5} cy={6} r={2} stroke={color} strokeWidth={strokeWidth} />
  <Path d="M14.5 13.5l1 2.3l2.3 1l-2.3 1l-1 2.3l-1-2.3l-2.3-1l2.3-1z" fill={accent ?? color} />
  <Path d="M4.5 15.5l4.2-.9l-1.6 4z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
</>);

/** Future — a sun lifting over the horizon, with its reflection. */
export const FutureGlyph = ({ size = 20, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Path d="M7 16.5a5 5 0 0 1 10 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Path d="M2.5 16.5h19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Path d="M9 19.8h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.6} />
  <Path d="M12 6.2v2.2M5.9 8.9l1.5 1.5M18.1 8.9l-1.5 1.5" stroke={accent ?? color} strokeWidth={strokeWidth} strokeLinecap="round" />
</>);

/** Faith — a candle with a living flame. */
export const FaithGlyph = ({ size = 20, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Path d="M12 2.8c2.3 2.7 3 4.2 3 5.7a3 3 0 0 1-6 0c0-1.5.8-3 3-5.7z" fill={accent ?? color} opacity={0.9} />
  <Path d="M12 7.2c.8 1 1 1.6 1 2.1a1 1 0 0 1-2 0c0-.5.3-1.1 1-2.1z" fill="#fff" opacity={0.75} />
  <Rect x={9.4} y={12.6} width={5.2} height={8.6} rx={1.2} stroke={color} strokeWidth={strokeWidth} />
  <Path d="M7.5 21.2h9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
</>);

/** Suggested — a folded note with a hand-written line. */
export const NoteGlyph = ({ size = 20, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Path d="M6 3.5h8.5l3.5 3.5v13.5H6z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  <Path d="M14.5 3.5V7H18" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  <Path d="M8.6 12.2c1.2-1 2.2 1 3.4 0s2.2 1 3.4 0" stroke={accent ?? color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Path d="M8.6 16h4.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
</>);

/** Sealed — an envelope closed with a heart seal (answers hidden until both reply). */
export const SealedGlyph = ({ size = 18, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Rect x={3.5} y={6} width={17} height={12.5} rx={2} stroke={color} strokeWidth={strokeWidth} />
  <Path d="M4 7l8 6.2L20 7" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  <Circle cx={12} cy={13.6} r={3} fill={accent ?? color} />
  <Path d="M12 14.9l-1.05-1a.65.65 0 0 1 1.05-.78a.65.65 0 0 1 1.05.78z" fill="#fff" />
</>);

/** Talk — two overlapping speech shapes, ours and theirs. */
export const TalkGlyph = ({ size = 18, color = "#000", accent, strokeWidth = 1.7 }: GlyphProps) => base(size, <>
  <Path d="M4.5 5h9a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H9l-3.2 2.8v-2.8H4.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  <Path d="M17.5 9.5h2a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2h-.8v2.6L15.6 18h-3.1a2 2 0 0 1-1.7-1" stroke={accent ?? color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
</>);

/** Send — a feather-tipped arrow. */
export const SendGlyph = ({ size = 18, color = "#000", strokeWidth = 2.2 }: GlyphProps) => base(size, <>
  <Path d="M12 20V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  <Path d="M6.5 10.2L12 4.5l5.5 5.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  <Path d="M9.6 17.4L12 15.6l2.4 1.8" stroke={color} strokeWidth={strokeWidth * 0.75} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
</>);

export function TopicGlyph({ topic, ...props }: GlyphProps & { topic: QuestionCard["topic"] }) {
  switch (topic) {
    case "us": return <UsGlyph {...props} />;
    case "deep": return <DeepGlyph {...props} />;
    case "fun": return <FunGlyph {...props} />;
    case "future": return <FutureGlyph {...props} />;
    case "faith": return <FaithGlyph {...props} />;
    default: return <NoteGlyph {...props} />;
  }
}

/** Corners of a w×h card rotated by `deg` around (cx, cy), as an SVG path. Rounded via a same-colour stroke. */
const rotatedCard = (x: number, y: number, w: number, h: number, deg: number, cx: number, cy: number) => {
  const r = (deg * Math.PI) / 180;
  const pt = (px: number, py: number) => {
    const dx = px - cx;
    const dy = py - cy;
    return `${(cx + dx * Math.cos(r) - dy * Math.sin(r)).toFixed(2)} ${(cy + dx * Math.sin(r) + dy * Math.cos(r)).toFixed(2)}`;
  };
  return `M${pt(x, y)} L${pt(x + w, y)} L${pt(x + w, y + h)} L${pt(x, y + h)} Z`;
};

/** A small fanned deck of three cards — the "pick a card" mark. */
export function DeckArt({ size = 52, colors }: { size?: number; colors: [string, string, string] }) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 64 52" fill="none">
      <Path d={rotatedCard(21, 9, 22, 34, -16, 32, 46)} fill={colors[2]} stroke={colors[2]} strokeWidth={6} strokeLinejoin="round" />
      <Path d={rotatedCard(22, 9, 22, 34, 14, 32, 46)} fill={colors[1]} stroke={colors[1]} strokeWidth={6} strokeLinejoin="round" />
      <Rect x={19} y={5} width={26} height={38} rx={5} fill={colors[0]} />
      <Path d="M32 31.5l-4.1-3.9a2.5 2.5 0 0 1 4.1-3a2.5 2.5 0 0 1 4.1 3z" fill="#fff" />
      <Path d="M24 11h4M36 37h4" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}
