import { useState, useCallback, useRef } from "react";

const TOAST_DURATION = 2500;

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setMessage(msg);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = setTimeout(() => setMessage(null), 250);
    }, TOAST_DURATION);
  }, []);

  return { message, visible, show };
}
