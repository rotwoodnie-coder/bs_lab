import * as React from "react";

export type EditorCanvasProps = {
  children: React.ReactNode;
};

export function EditorCanvas({ children }: EditorCanvasProps) {
  return <div className="min-w-0 space-y-6">{children}</div>;
}

