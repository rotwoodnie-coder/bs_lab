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
  const fallbackTimerRef = useRef<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pendingUnlockRef = useRef(false);
  const fallbackShownRef = useRef(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const clearSpeech = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
  }, [supported]);

  const showFallback = useCallback(
    (text: string) => {
      if (fallbackShownRef.current) return;
      fallbackShownRef.current = true;
      setState("locked");
      options.onFallbackPrompt?.(text);
    },
    [options],
  );

  const finalizeUnlock = useCallback(() => {
    clearTimer();
    clearSpeech();
    pendingUnlockRef.current = false;
    fallbackShownRef.current = false;
    setCountdown(0);
    setSafetyText(null);
    setState("unlocked");
  }, [clearSpeech, clearTimer]);

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
        showFallback(text);
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      const hasChineseVoice = voices.some((voice) => /zh|cmn/i.test(voice.lang) || /中文|普通话|国语/.test(voice.name));
      if (voices.length > 0 && !hasChineseVoice) {
        showFallback(text);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance;
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.lang = "zh-CN";
      utterance.onstart = () => setState("locked");
      utterance.onend = () => {
        pendingUnlockRef.current = true;
        setCountdown((current) => current);
      };
      utterance.onerror = () => {
        pendingUnlockRef.current = true;
        setCountdown(0);
        showFallback(text);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }

      fallbackTimerRef.current = window.setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          showFallback(text);
        }
      }, 500);

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
    [clearSpeech, clearTimer, showFallback, supported],
  );

  const manuallyConfirmSafety = useCallback(() => {
    pendingUnlockRef.current = true;
    setCountdown(0);
    finalizeUnlock();
  }, [finalizeUnlock]);

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
