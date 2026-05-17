// 更可靠的流式测试脚本
const response = await fetch('http://localhost:4100/v2/ai/chat/stream', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-user-id': 'test', 'x-role': 'Teacher' },
  body: JSON.stringify({ message: '说两个字' }),
});

console.log('Status:', response.status);
console.log('Headers:', [...response.headers.entries()].map(([k,v])=>`${k}: ${v}`).join('\n  '));

let chunks = 0;
let bytes = 0;
const reader = response.body.getReader();
const decoder = new TextDecoder();

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('\nStream complete. Total chunks:', chunks, 'Total bytes:', bytes);
      break;
    }
    chunks++;
    bytes += value.length;
    const text = decoder.decode(value, { stream: true });
    process.stdout.write(`[chunk ${chunks} (${value.length}b)] ${text.slice(0, 200)}\n`);
  }
} catch (err) {
  console.error('\nStream error:', err.message);
}
