import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "@/types/chat";
import styles from "./styles";

interface Props {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  sending: boolean;

  onSend: () => void;

  // ⬇️ make optional
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onPickImage?: () => void;
}

export function ChatInput({
  text,
  setText,
  sending,
  replyingTo,
  onCancelReply,
  onSend,
  onPickImage,
}: Props) {
  return (
    <View style={styles.bottomStack}>
      {replyingTo && (
        <View style={styles.replyBar}>
          <Text numberOfLines={1}>
            Replying to: {replyingTo.text ?? "Image"}
          </Text>
          <Ionicons name="close" size={18} onPress={onCancelReply} />
        </View>
      )}

      <View style={styles.inputWrapper}>
        <TouchableOpacity onPress={onPickImage}>
          <Ionicons name="image-outline" size={22} color="#6366f1" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor="#9ca3af"
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="center"
        />

        <TouchableOpacity
          onPress={onSend}
          style={styles.sendButton}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}