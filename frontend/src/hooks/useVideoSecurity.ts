"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VideoSecurityState = "idle" | "locking" | "locked" | "unlocking" | "unlocked";

type SecurityOptions = {
  onFallbackPrompt?: (text: string) => void;
};

export function useVideoSecurity(options: SecurityOptions = {}) {
  const [countdown, setCountdown] = useState(0);
  const [state, setState] = useState<VideoSecurityState>("idle");
  const [safetyText, setSafetyText] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pendingUnlockRef = useRef(false);
  const fallbackShownRef = useRef(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearSpeech = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
  }, [supported]);

  const finalizeUnlock = useCallback(() => {
    clearTimer();
    clearSpeech();
    pendingUnlockRef.current = false;
    fallbackShownRef.current = false;
    setCountdown(0);
    setSafetyText(null);
    setState("unlocked");
  }, [clearSpeech, clearTimer]);

  const unlockIfReady = useCallback(() => {
    if (pendingUnlockRef.current && countdown <= 0) {
      finalizeUnlock();
    }
  }, [countdown, finalizeUnlock]);

  useEffect(() => {
    unlockIfReady();
  }, [countdown, unlockIfReady]);

  const start = useCallback(
    (text: string | null) => {
      clearTimer();
      clearSpeech();
      pendingUnlockRef.current = false;
      fallbackShownRef.current = false;
      setSafetyText(text);

      if (!text) {
        setState("unlocked");
        return;
      }

      if (!supported) {
        setState("locked");
        options.onFallbackPrompt?.(text);
        fallbackShownRef.current = true;
        return;
      }

      const seconds = Math.max(2, Math.ceil(text.length / 6));
      setCountdown(seconds);
      setState("locking");

      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance;
      utterance.onstart = () => setState("locked");
      utterance.onend = () => {
        pendingUnlockRef.current = true;
        setCountdown((current) => current);
      };
      utterance.onerror = () => {
        pendingUnlockRef.current = true;
        setCountdown(0);
        setState("locked");
        if (!fallbackShownRef.current) {
          fallbackShownRef.current = true;
          options.onFallbackPrompt?.(text);
        }
      };

      window.speechSynthesis.speak(utterance);

      timerRef.current = window.setInterval(() => {
        setCountdown((current) => {
          if (current <= 1) {
            clearTimer();
            pendingUnlockRef.current = true;
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    },
    [clearSpeech, clearTimer, options, supported],
  );

  const manuallyConfirmSafety = useCallback(() => {
    pendingUnlockRef.current = true;
    setCountdown((current) => current);
    if (countdown <= 0) finalizeUnlock();
  }, [countdown, finalizeUnlock]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearSpeech();
    };
  }, [clearSpeech, clearTimer]);

  return useMemo(
    () => ({
      countdown,
      state,
      safetyText,
      isLocked: state === "locking" || state === "locked",
      isSupported: supported,
      start,
      manuallyConfirmSafety,
      forceUnlock: finalizeUnlock,
    }),
    [countdown, finalizeUnlock, manuallyConfirmSafety, safetyText, start, state, supported],
  );
}
