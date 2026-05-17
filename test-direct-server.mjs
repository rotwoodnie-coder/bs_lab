import http from "http";
import crypto from "node:crypto";

const key = "sk-e989f1fb7b994a7e917e2c1d59902609";
const base = "https://dashscope.aliyuncs.com/compatible-mode/v1".replace(/\/+$/, "");
const apiPath = base.endsWith("/v1") ? "/chat/completions" : "/v1/chat/completions";
const url = base + apiPath;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/stream") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    });

    const tid = crypto.randomUUID();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    res.write(`data: ${JSON.stringify({ type: "meta", logId: "direct_test_" + tid.slice(0, 8) })}\n\n`);

    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + key,
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages: [{ role: "system", content: "你是助教" }, { role: "user", content: "说两个字" }],
        stream: true,
        max_tokens: 100,
      }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`API ${response.status}: ${body.slice(0, 200)}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (req.destroyed) { console.log("req destroyed during read"); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const json = JSON.parse(jsonStr);
            const token = json.choices?.[0]?.delta?.content ?? "";
            if (token) {
              tokenCount++;
              res.write(`data: ${JSON.stringify({ type: "token", data: token })}\n\n`);
            }
          } catch {}
        }
      }
      console.log("Stream complete, tokens:", tokenCount);
      res.write("data: [DONE]\n\n");
      res.end();
    }).catch((err) => {
      console.error("Stream error:", err.message);
      if (!req.destroyed) {
        res.write(`data: ${JSON.stringify({ type: "error", data: err.message })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
    }).finally(() => clearTimeout(timeout));

    req.on("close", () => console.log("req closed"));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4198, () => {
  console.log("Test server on :4198");
});
