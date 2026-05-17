fetch('http://localhost:4100/v2/ai/chat/stream', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-user-id': 'test', 'x-role': 'Teacher' },
  body: JSON.stringify({ message: '你好' }),
}).then(async r => {
  console.log('Status:', r.status);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('\nDONE. Total data received:', buf.length, 'bytes');
      if (buf.length > 0) console.log('Raw data:', buf.slice(0, 500));
      break;
    }
    const text = decoder.decode(value);
    buf += text;
    process.stdout.write(`[${value.length}b]`);
  }
}).catch(e => console.error('ERR:', e.message));
