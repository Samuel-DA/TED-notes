import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Write something daring..."
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
          <Text style={styles.arrow}>↑</Text>
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
    borderTopWidth: 0.5,
     backgroundColor: "#0f172a",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  send: {
    marginLeft: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  arrow: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
});