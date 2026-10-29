import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { palette } from "@/constants/design";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
};

export default function TodoInputBar({ value, onChange, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(50);
  const [buttonScale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { paddingBottom: (insets.bottom || 12) + 78 }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Add a shared plan…"
        placeholderTextColor="#9ca3af"
        multiline
        onContentSizeChange={(e) =>
          setHeight(
            Math.min(120, Math.max(50, e.nativeEvent.contentSize.height))
          )
        }
        style={[styles.input, { height }]}
      />

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          onPress={onSend}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!value.trim()}
          style={[
            styles.send,
            { opacity: value.trim() ? 1 : 0.4 },
          ]}
        >
          <Plus color="#fff" size={22} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(23,19,29,0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.text,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  send: {
    marginLeft: 12,
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: palette.rose,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.rose,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
