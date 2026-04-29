import { ShieldX } from "@bs-lab/ui/icons";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <ShieldX className="size-16 text-muted-foreground/40" />
      <p className="text-lg font-medium text-foreground">权限不足</p>
      <p className="text-sm text-muted-foreground">仅超级管理员可访问此页面。</p>
    </div>
  );
}
