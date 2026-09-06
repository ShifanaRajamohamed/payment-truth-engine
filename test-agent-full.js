const { spawn } = require('child_process');
const http = require('http');

function waitHealth(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const iv = setInterval(() => {
      http.get(url, (r) => {
        if (r.statusCode === 200) { clearInterval(iv); resolve(); }
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) { clearInterval(iv); reject(new Error('server did not start')); }
      });
    }, 250);
  });
}

async function postJSON(port, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, timeout: 25000 }, (res) => {
      let s = '';
      res.on('data', (c) => s += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(s) }); }
        catch (e) { resolve({ status: res.statusCode, body: s }); }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', body: 'request timed out' }); });
    req.on('error', (e) => resolve({ status: 'ERR', body: e.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  const child = spawn('node', ['apps/api/dist/main.js'], {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderrLog = '';
  child.stderr.on('data', (d) => { stderrLog += d.toString(); });

  try {
    await waitHealth('http://localhost:3000/health', 20000);
    console.log('=== Server started ===');

    // Detect whether the real Gemini key is actually being used
    const realKey = !!process.env.GEMINI_API_KEY;
    console.log('GEMINI_API_KEY present in env:', realKey);

    const questions = [
      ['What is today\'s collection?', 'en'],
      ['What was yesterday\'s revenue?', 'en'],
      ['How is Coimbatore performing this month?', 'en'],
      ['What are the payment method shares - UPI vs Card?', 'en'],
      ['What are the payment failure reasons?', 'en'],
      ['What was last month\'s revenue?', 'en'],
      ['What if I give a 15% discount?', 'en'],
      ['What should I do to improve the payment success rate?', 'en'],
      ['Why can\'t you provide yesterday\'s revenue?', 'en'],  // follow-up
      ['இன்றைய வசூல் எவ்வளவு?', 'ta'],  // Tamil
    ];

    let prevActiveTopic = undefined;
    for (const [q, lang] of questions) {
      const payload = { query: q, languageCode: lang, conversationHistory: [], activeTopic: prevActiveTopic };
      const t0 = Date.now();
      const r = await postJSON(3000, '/api/agent/query', payload);
      const ms = Date.now() - t0;
      const b = r.body || {};
      console.log('==========');
      console.log(`Q(${lang}, ${ms}ms, HTTP ${r.status}): ${q}`);
      if (b && b.answer) {
        console.log('CONF:', b.confidence, '| TOPIC:', b.activeTopic?.topic);
        console.log('A:', b.answer);
      } else {
        console.log('RESPONSE:', JSON.stringify(b).slice(0, 500));
      }
      prevActiveTopic = b.activeTopic || prevActiveTopic;
    }
  } catch (e) {
    console.log('SERVER ERROR / did not start:', e.message);
    console.log('STDERR (last 1500):', stderrLog.slice(-1500));
  } finally {
    child.kill('SIGKILL');
    // drain
    await new Promise((r) => setTimeout(r, 300));
  }
})();
