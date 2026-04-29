"use client";

import * as React from "react";

export function PropsDocBlock({ text }: { text: string }) {
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ul
      role="list"
      className="space-y-1.5 rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5 text-xs text-muted-foreground"
    >
      {lines.map((line, i) => (
        <li key={i} className="font-mono text-[11px] leading-snug [word-break:break-word]">
          {line}
        </li>
      ))}
    </ul>
  );
}
