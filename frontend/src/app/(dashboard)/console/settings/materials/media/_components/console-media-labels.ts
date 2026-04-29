/** `data_file.status`：设计稿为启用/停用；库内常见为 y/n。 */
export function dataFileStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "y" || s === "t") return "启用";
  if (s === "n") return "停用";
  if (!s) return "—";
  return status ?? "—";
}

export function dataFileStatusVariant(status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "y" || s === "t") return "secondary";
  if (s === "n") return "outline";
  return "outline";
}
