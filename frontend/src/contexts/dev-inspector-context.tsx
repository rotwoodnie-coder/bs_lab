"use client";

import * as React from "react";

const STORAGE_KEY = "bs-lab:console-dev-inspector";

type DevInspectorValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const DevInspectorContext = React.createContext<DevInspectorValue | null>(null);

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStored(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function DevInspectorProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = React.useState(false);

  React.useEffect(() => {
    setEnabledState(readStored());
  }, []);

  const setEnabled = React.useCallback((v: boolean) => {
    setEnabledState(v);
    writeStored(v);
  }, []);

  const value = React.useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);

  return <DevInspectorContext.Provider value={value}>{children}</DevInspectorContext.Provider>;
}

/** 控制台「开发者视图」：展示技术 ID、指纹、幂等键等；未包裹 Provider 时恒为关闭。 */
export function useDevInspector(): DevInspectorValue {
  const ctx = React.useContext(DevInspectorContext);
  if (!ctx) {
    return {
      enabled: false,
      setEnabled: () => {},
    };
  }
  return ctx;
}
