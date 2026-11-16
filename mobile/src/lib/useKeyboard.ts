import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Single source of keyboard state. Pass active=false to detach the listeners
 * (for example while a Modal is closed). iOS uses the Will events so layout
 * moves with the keyboard animation, Android only has the Did events.
 */
export function useKeyboard(active = true) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!active) {
      setHeight(0);
      return;
    }
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [active]);

  return { height, visible: height > 0 };
}