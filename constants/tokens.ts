import { Platform } from "react-native";

/**
 * TED Space design tokens — one set per colour scheme.
 * Components read these through `useTheme()` so the whole app follows the phone's light/dark setting.
 */
export type Theme = {
  mode: "light" | "dark";
  /** Screen background gradient (top → bottom). */
  bg: readonly [string, string, string];
  bgSolid: string;
  /** Cards and list rows. */
  surface: string;
  /** Sheets, menus, the tab bar — always opaque. */
  surfaceRaised: string;
  /** Inputs, segmented-control tracks, unselected chips. */
  surfaceSunken: string;
  surfacePressed: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Brand */
  accent: string;
  accentSoft: string;
  accentText: string;
  violet: string;
  violetSoft: string;
  violetText: string;
  plum: string;
  /** Primary action gradient and the soft hero wash behind feature cards. */
  gradient: readonly [string, string];
  heroWash: readonly [string, string, string];
  onAccent: string;
  /** Status */
  success: string;
  successSoft: string;
  successText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  info: string;
  infoSoft: string;
  infoText: string;
  /** Selected chip (inverted) */
  inverse: string;
  onInverse: string;
  overlay: string;
  statusBar: "light" | "dark";
  shadow: object;
  shadowLg: object;
};

const shadowFor = (color: string, opacity: number, radius: number, y: number, elevation: number) =>
  Platform.select({
    ios: { shadowColor: color, shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: y } },
    android: { elevation },
    default: {},
  }) as object;

export const darkTheme: Theme = {
  mode: "dark",
  bg: ["#24162C", "#18121E", "#120D17"],
  bgSolid: "#17121D",
  surface: "rgba(255,255,255,0.065)",
  surfaceRaised: "#221A2A",
  surfaceSunken: "rgba(255,255,255,0.07)",
  surfacePressed: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.11)",
  borderStrong: "rgba(255,255,255,0.2)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.7)",
  textMuted: "rgba(255,255,255,0.46)",
  accent: "#E0567A",
  accentSoft: "rgba(224,86,122,0.16)",
  accentText: "#F7B9C9",
  violet: "#A47FD6",
  violetSoft: "rgba(164,127,214,0.18)",
  violetText: "#D9C6F3",
  plum: "#5B2E75",
  gradient: ["#E0567A", "#6B3488"],
  heroWash: ["rgba(224,86,122,0.28)", "rgba(107,52,136,0.20)", "rgba(255,255,255,0.03)"],
  onAccent: "#FFFFFF",
  success: "#2FBF8C",
  successSoft: "rgba(47,191,140,0.16)",
  successText: "#86E3C1",
  warning: "#F2B33D",
  warningSoft: "rgba(242,179,61,0.16)",
  warningText: "#FFD58A",
  danger: "#F0607E",
  dangerSoft: "rgba(240,96,126,0.16)",
  dangerText: "#FF9BAE",
  info: "#5B8DEF",
  infoSoft: "rgba(91,141,239,0.18)",
  infoText: "#B9CEFA",
  inverse: "#FFFFFF",
  onInverse: "#1B1320",
  overlay: "rgba(8,5,12,0.6)",
  statusBar: "light",
  shadow: shadowFor("#000", 0.25, 16, 8, 0),
  shadowLg: shadowFor("#000", 0.35, 24, 12, 12),
};

export const lightTheme: Theme = {
  mode: "light",
  bg: ["#FFF1F4", "#FBF7FB", "#F2ECF8"],
  bgSolid: "#FBF7FB",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#F5EFF6",
  surfacePressed: "#EFE6F1",
  border: "#EFE4EF",
  borderStrong: "#DDCBDF",
  text: "#211A2C",
  textSecondary: "#5F5569",
  textMuted: "#9A8EA4",
  accent: "#D9476D",
  accentSoft: "#FCE6EC",
  accentText: "#B3305A",
  violet: "#8C5BB7",
  violetSoft: "#F1E8FA",
  violetText: "#6E3E98",
  plum: "#5B2E75",
  gradient: ["#E0567A", "#8C5BB7"],
  heroWash: ["#FCE3EA", "#F1E6FA", "#FFFFFF"],
  onAccent: "#FFFFFF",
  success: "#1E9E72",
  successSoft: "#E2F6EE",
  successText: "#137A57",
  warning: "#D9900F",
  warningSoft: "#FFF1D6",
  warningText: "#8F5B00",
  danger: "#D63B5C",
  dangerSoft: "#FDE5EA",
  dangerText: "#B42347",
  info: "#3B6FD8",
  infoSoft: "#E6EEFD",
  infoText: "#2853A8",
  inverse: "#211A2C",
  onInverse: "#FFFFFF",
  overlay: "rgba(33,26,44,0.38)",
  statusBar: "dark",
  shadow: shadowFor("#6B3A63", 0.08, 18, 8, 2),
  shadowLg: shadowFor("#6B3A63", 0.14, 28, 14, 10),
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 26, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const type = {
  display: { fontSize: 30, lineHeight: 34, fontWeight: "800" as const, letterSpacing: -0.9 },
  title: { fontSize: 22, lineHeight: 27, fontWeight: "800" as const, letterSpacing: -0.4 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: "700" as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "500" as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "800" as const, letterSpacing: 1.2 },
};
