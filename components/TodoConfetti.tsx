import React from "react";
import ConfettiCannon from "react-native-confetti-cannon";

type Props = {
  visible: boolean;
  onDone: () => void;
  confettiKey: number;
};

export default function TodoConfetti({ visible, onDone, confettiKey }: Props) {
  if (!visible) return null;

  return (
    <ConfettiCannon
      key={confettiKey}
      count={60}
      origin={{ x: -10, y: 0 }}
      fadeOut
      autoStart
    />
  );
}
