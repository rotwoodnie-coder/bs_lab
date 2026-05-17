import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERSION_FILE = resolve(__dirname, "../../../../VERSION");

let cachedVersion: string | null = null;

/** 读取 VERSION 文件，缓存到进程退出 */
function readVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    cachedVersion = readFileSync(VERSION_FILE, "utf-8").trim() || "0.0.0";
  } catch {
    cachedVersion = "0.0.0";
  }
  return cachedVersion;
}

export function routeV2Version(request: Request): Promise<Response> | Response {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== "/v2/version") {
    return new Response(null, { status: 404 });
  }
  return Response.json({ success: true, data: { version: readVersion() } });
}
