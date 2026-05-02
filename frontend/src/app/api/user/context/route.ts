import { NextRequest, NextResponse } from "next/server";

/** 与 middleware.ts 一致的 base64url 解码 */
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + "====".slice(str.length % 4 || 4);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of base64) {
    if (char === "=") break;
    const val = chars.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get("v2_access_token");
  let hasBinding = false;
  if (tokenCookie?.value) {
    const dotIdx = tokenCookie.value.indexOf(".");
    if (dotIdx > 0) {
      try {
        const json = JSON.parse(base64UrlDecode(tokenCookie.value.slice(0, dotIdx)));
        hasBinding = json.has_binding === true;
      } catch {
        // token 解析失败，维持 false
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      role: "parent",
      has_binding: hasBinding,
      school_level_id: null,
      nickName: "测试家长",
      avatar: "",
    },
    error: null,
  });
}
