import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 统一 className 合并工具：
 * 1) 先用 clsx 处理条件类名
 * 2) 再用 tailwind-merge 去重并解决冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

