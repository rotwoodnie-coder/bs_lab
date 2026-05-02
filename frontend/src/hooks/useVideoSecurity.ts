"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useVideoSecurity() {
  const [countdown, setCountdown] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimer();
    setCountdown(0);
    setIsLocked(false);
  }, [clearTimer]);

  const start = useCallback(
    (text: string | null) => {
      if (!supported || !text) {
        finish();
        return;
      }

      clearTimer();
      const seconds = Math.max(2, Math.ceil(text.length / 6));
      setCountdown(seconds);
      setIsLocked(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      timerRef.current = window.setInterval(() => {
        setCountdown((current) => {
          if (current <= 1) {
            clearTimer();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    },
    [clearTimer, finish, supported],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return useMemo(() => ({ countdown, isLocked, isSupported: supported, start }), [countdown, isLocked, supported, start]);
}
