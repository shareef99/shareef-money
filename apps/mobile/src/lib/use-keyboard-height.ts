import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

// Current on-screen keyboard height (0 when hidden). Used to lift bottom-sheet
// and centered modals above the keyboard — KeyboardAvoidingView is unreliable
// inside a transparent Modal on Android, but the Keyboard events always fire.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
