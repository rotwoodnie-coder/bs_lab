import { handleAiChatStream } from "./src/services/AiChatService.ts";

async function main() {
  console.log("Starting test...");
  try {
    const stream = handleAiChatStream(
      { message: "说两个字" },
      { userId: "test-uid", userRole: "Teacher" },
      "test-trace"
    );

    let count = 0;
    for await (const chunk of stream) {
      count++;
      console.log(`Chunk ${count}: ${chunk.slice(0, 150)}`);
    }
    console.log(`Total chunks: ${count}`);
  } catch (err) {
    console.error("Stream error:", err instanceof Error ? err.message : err);
    console.error("Stack:", err instanceof Error ? err.stack : "");
  }
}

main().catch(console.error);
