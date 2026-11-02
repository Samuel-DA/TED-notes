import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { darkTheme, lightTheme, type Theme } from "@/constants/tokens";

/** The active theme, following the phone's light/dark setting. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "light" ? lightTheme : darkTheme;
}

/**
 * Create a themed stylesheet hook:
 *   const useStyles = makeStyles((t) => ({ card: { backgroundColor: t.surface } }));
 *   const s = useStyles();
 */
type StyleInput = Parameters<typeof StyleSheet.create>[0];

export function makeStyles<T extends StyleInput>(factory: (theme: Theme) => T) {
  const cache = new WeakMap<Theme, Readonly<T>>();
  return function useStyles(): Readonly<T> {
    const theme = useTheme();
    return useMemo(() => {
      const hit = cache.get(theme);
      if (hit) return hit;
      const created = StyleSheet.create(factory(theme));
      cache.set(theme, created);
      return created;
    }, [theme]);
  };
}
