import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Delete } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { getColors } from "../lib/colors";
import { setPasscode } from "../lib/passcode";
import { cn } from "../lib/cn";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"];

type Props = {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
};

// Two-step PIN creation: enter a 4-digit code, then confirm it. On a match the
// passcode is written to the keystore and onDone() fires.
export function PasscodeSetupModal({ visible, onClose, onDone }: Props) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [first, setFirst] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const c = getColors(useColorScheme().colorScheme);

  const reset = () => {
    setStep("enter");
    setFirst("");
    setPin("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const commit = (value: string) => {
    if (step === "enter") {
      setFirst(value);
      setPin("");
      setStep("confirm");
      return;
    }
    if (value === first) {
      setPasscode(value).then(() => {
        reset();
        onDone();
      });
    } else {
      setError("Passcodes don't match. Start over.");
      setStep("enter");
      setFirst("");
      setPin("");
    }
  };

  const press = (key: string) => {
    setError("");
    if (key === "backspace") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      // Defer so the last dot renders before we advance/commit.
      setTimeout(() => commit(next), 120);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-lg font-semibold text-text">
          {step === "enter" ? "Set a passcode" : "Confirm passcode"}
        </Text>
        <Text className="text-sm text-text-secondary mt-1">
          {step === "enter"
            ? "Choose a 4-digit code"
            : "Re-enter your code"}
        </Text>
        {error ? (
          <Text className="text-sm text-error mt-2">{error}</Text>
        ) : null}

        <View className="flex-row gap-4 mt-8">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2",
                i < pin.length
                  ? "bg-primary border-primary"
                  : "border-text-secondary",
              )}
            />
          ))}
        </View>

        <View className="w-full max-w-xs mt-10">
          <View className="flex-row flex-wrap">
            {KEYS.map((key, i) => (
              <View key={i} className="w-1/3 items-center justify-center py-2">
                {key === "" ? (
                  <View className="w-16 h-16" />
                ) : (
                  <Pressable
                    className="w-16 h-16 items-center justify-center rounded-full active:bg-card"
                    onPress={() => press(key)}
                  >
                    {key === "backspace" ? (
                      <Delete size={26} color={c.text} />
                    ) : (
                      <Text className="text-2xl text-text">{key}</Text>
                    )}
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>

        <Pressable className="mt-8 py-2" onPress={handleClose}>
          <Text className="text-base text-text-secondary">Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
