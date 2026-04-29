export type ParsedTeachingContextBulk = {
  textbookVersion: string;
  unit: string;
  lessonPeriod: string;
};

function firstMatch(text: string, re: RegExp): string {
  const m = text.match(re);
  return m ? m[0].replace(/\s+/g, " ").trim() : "";
}

/**
 * 从综合描述（可含实验名称、课标摘要、教材说明等）中启发式提取教材版本、单元、课时。
 */
export function parseTeachingContextBulk(raw: string): ParsedTeachingContextBulk {
  const t = raw.replace(/\r\n/g, "\n").trim();
  const out: ParsedTeachingContextBulk = { textbookVersion: "", unit: "", lessonPeriod: "" };
  if (!t) return out;

  const lp =
    firstMatch(t, /(?:共\s*)?\d+(?:\.\d+)?\s*课时/) ||
    firstMatch(t, /课型\s*[:：]?\s*\d+(?:\.\d+)?\s*课时?/) ||
    firstMatch(t, /(?:本课|本节|本实验)\s*[:：]?\s*\d+(?:\.\d+)?\s*学时/) ||
    firstMatch(t, /\d+\s*课时/);
  if (lp) out.lessonPeriod = lp.replace(/\s+/g, "");

  const u1 = firstMatch(t, /第\s*[一二三四五六七八九十百千万零两〇\d]+\s*单元/);
  if (u1) out.unit = u1.replace(/\s+/g, "");
  else {
    const u2 = firstMatch(t, /第\s*\d+\s*章/);
    if (u2) out.unit = u2.replace(/\s+/g, "");
    else {
      const u3 = firstMatch(t, /Unit\s*\d+/i);
      if (u3) out.unit = u3;
      else {
        const u4 = firstMatch(t, /模块\s*[一二三四五六七八九十\d]+/);
        if (u4) out.unit = u4.replace(/\s+/g, "");
      }
    }
  }

  const pub = firstMatch(
    t,
    /(?:人教|苏教|教科|北师大|沪科|沪粤|浙教|冀教|外研|译林|湘教|鲁科)(?:\s*\d{4})?\s*版/,
  );
  if (pub) {
    out.textbookVersion = pub;
  } else {
    const line = t
      .split(/[\n。;；]/)
      .map((s) => s.trim())
      .find((line) => /版/.test(line) && !/课标/.test(line) && line.length < 120);
    if (line) {
      out.textbookVersion = line.replace(/^【[^】]+】\s*/, "").replace(/^教材[:：]\s*/, "").trim();
    }
  }

  return out;
}
