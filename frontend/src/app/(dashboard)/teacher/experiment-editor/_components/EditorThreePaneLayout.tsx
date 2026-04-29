import * as React from "react";

export function EditorThreePaneLayout(props: {
  left: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
}) {
  const hasRight = Boolean(props.right);
  return (
    <div
      className={[
        "grid h-full gap-5 overflow-hidden",
        hasRight ? "grid-cols-[220px_minmax(0,1fr)_300px]" : "grid-cols-[220px_minmax(0,1fr)]",
      ].join(" ")}
    >
      <aside className="space-y-4 overflow-y-auto pr-1">
        {props.left}
      </aside>
      <main className="min-h-0 min-w-0 overflow-hidden">{props.center}</main>
      {hasRight ? (
        <aside className="space-y-4 overflow-y-auto pl-1">
          {props.right}
        </aside>
      ) : null}
    </div>
  );
}
