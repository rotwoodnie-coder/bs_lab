/** 从原始文件名得到默认展示标题（去掉扩展名）。 */
export function defaultMaterialTitleFromFileName(name: string): string {
  const t = name.trim();
  const i = t.lastIndexOf(".");
  if (i <= 0) return t;
  return t.slice(0, i).trim() || t;
}
