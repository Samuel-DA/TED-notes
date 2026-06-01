import React from "react";
import { View, TouchableWithoutFeedback, StyleSheet } from "react-native";
import EmojiSelector, { Categories } from "react-native-emoji-selector";
import { useKeyboardState } from "react-native-keyboard-controller";

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  // get keyboard height from the controller
  const keyboardHeight = useKeyboardState((state) => state.height); // number

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={[styles.overlay, { marginBottom: keyboardHeight }]}>
        <View style={styles.container}>
          <EmojiSelector
            category={Categories.all}
            onEmojiSelected={onSelect}
            showSearchBar={false}
            showTabs
            columns={8}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end", // push content to bottom
  },
  container: {
    height: 250,
    backgroundColor: "#fff",
  },
});