import http from 'http';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/sse') {
    let body = '';
    req.on('data', (c) => body += c);
    req.on('end', () => {
      console.log('Body received:', body);
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        'x-trace-id': 'test-trace',
      });
      
      // 模拟 30ms 的异步操作
      setTimeout(() => {
        res.write('data: {"type":"meta","logId":"test"}\n\n');
        
        let count = 0;
        const iv = setInterval(() => {
          count++;
          res.write(`data: {"type":"token","data":"token${count}"}\n\n`);
          if (count >= 3) {
            clearInterval(iv);
            res.write('data: [DONE]\n\n');
            res.end();
          }
        }, 500);
      }, 30);
    });
    
    req.on('close', () => {
      console.log('req closed (client disconnected)');
    });
  } else {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
  }
});

server.listen(4199, () => {
  console.log('Test SSE server on :4199 (POST mode)');
  
  setTimeout(async () => {
    try {
      const r = await fetch('http://localhost:4199/sse', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': 'test', 'x-role': 'Teacher' },
        body: JSON.stringify({ message: '你好' }),
      });
      console.log('Status:', r.status);
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let eventCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) { console.log('Stream done'); break; }
        const text = dec.decode(value);
        buf += text;
        eventCount++;
        process.stdout.write(`[${value.length}b]`);
      }
      console.log('\nTotal events:', eventCount);
    } catch(e) {
      console.error('Client error:', e.message);
    }
    server.close();
  }, 500);
});
