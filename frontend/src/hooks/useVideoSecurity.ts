"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SecurityState = "idle" | "speaking" | "done";

export function useVideoSecurity() {
  const [state, setState] = useState<SecurityState>("idle");
  const [countdown, setCountdown] = useState<number>(0);

  const isLocked = state === "speaking";

  const startSpeak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    setState("speaking");
    setCountdown(Math.max(1, Math.ceil(text.length / 8)));
    utterance.onend = () => setState("done");
    utterance.onerror = () => setState("done");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const onDone = useCallback(() => setState("done"), []);

  useEffect(() => {
    if (state !== "speaking") return;
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [state, countdown]);

  return useMemo(
    () => ({ state, countdown, isLocked, startSpeak, onDone, setState }),
    [state, countdown, isLocked, startSpeak, onDone],
  );
}
