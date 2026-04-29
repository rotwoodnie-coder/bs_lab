/** 与 {@link DashboardCommandPalette} 配合：在任意客户端组件触发打开全局搜索 */
export const OPEN_COMMAND_PALETTE_EVENT = "bs-lab:open-command-palette";

export function requestOpenCommandPalette(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
}
