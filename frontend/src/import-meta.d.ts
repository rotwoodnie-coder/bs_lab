/** Turbopack / bundler：import.meta.glob（用于 UI Lab 自动注册） */
interface ImportMeta {
  glob<T = unknown>(
    pattern: string,
    options?: { eager?: boolean; import?: string },
  ): Record<string, T>;
}
