const fs = require('fs');
const readline = require('readline');

async function processTrace() {
  const fileStream = fs.createReadStream('test-results/trace-unzipped/0-trace.network');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('--- NETWORK REQUESTS ---');
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.type === 'resource-snapshot') {
        const req = data.snapshot.request;
        const res = data.snapshot.response;
        // Filter out next.js static chunks / styles to keep it readable, unless they are API calls or page loads
        if (req.url.includes('/_next/') || req.url.includes('/static/') || req.url.includes('dicebear.com')) {
          continue;
        }
        console.log(`${req.method} ${req.url} -> ${res.status} ${res.statusText}`);
        if (res.status >= 400) {
          console.log('  Response Headers:', JSON.stringify(res.headers));
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

processTrace();
