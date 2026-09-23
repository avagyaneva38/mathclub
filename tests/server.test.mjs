import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../scripts/serve.mjs';
test('serves static assets with security headers and keeps local files private', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/', '/styles.css', '/js/app.js', '/js/model.js', '/js/storage.js', '/js/reports.js']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
    }
    for (const path of ['/math_club_data.json', '/app.py', '/package.json', '/.git/config', '/..%5capp.py']) assert.equal((await fetch(base + path)).status, 404);
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
