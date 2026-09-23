// Optional end-to-end checks using an installed Chrome or Edge, with no npm dependencies.
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createServer } from './serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
let executable;
for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch {} }
if (!executable) throw new Error('Set CHROME_PATH to an installed Chrome or Edge executable.');
const resultsRoot = path.join(root, 'test-results');
await mkdir(resultsRoot, { recursive: true });
const out = await mkdtemp(path.join(resultsRoot, 'run-'));
const profile = await mkdtemp(path.join(tmpdir(), 'mathclub-browser-test-'));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let browserError;
browser.on('error', error => { browserError = error; });
let socket;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) {
  for (let i = 0; i < 100; i++) { if (browserError) throw browserError; try { const value = await fn(); if (value) return value; } catch (error) { if (i === 99) throw error; } await pause(100); }
  throw new Error('Browser check timed out.');
}
try {
  const port = await until(async () => (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); if (callback) { pending.delete(message.id); message.error ? callback.reject(new Error(JSON.stringify(message.error))) : callback.resolve(message.result); } }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++serial;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
      pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
  async function route(name) { await evaluate(`location.hash = ${JSON.stringify(name)}`); await until(() => evaluate(`document.querySelector('nav a[aria-current]')?.hash === ${JSON.stringify('#' + name)}`)); }
  async function submit(id, values) {
    await evaluate(`(() => { const f = document.getElementById(${JSON.stringify(id)}); for (const [key,value] of Object.entries(${JSON.stringify(values)})) f.elements.namedItem(key).value = value; f.requestSubmit(); })()`);
  }
  const data = () => evaluate(`JSON.parse(localStorage.getItem('mathclub.finance.v1'))`);
  async function importFile(filename, raw) {
    const file = path.join(out, filename); await writeFile(file, raw);
    const doc = await send('DOM.getDocument');
    const { nodeId } = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#import' });
    await send('DOM.setFileInputFiles', { nodeId, files: [file] });
  }
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: base });
  await until(() => evaluate(`!!document.getElementById('budget')`));
  console.log('Browser loaded the dashboard.');
  await submit('budget', { balance: 200 });
  assert.equal((await data()).starting_balance, 200);
  await route('events');
  await submit('create-event', { name: 'Meeting <script>alert(1)</script>' });
  await submit('expense', { category: 'Food', amount: '25.00', description: '<img src=x onerror=alert(1)>' });
  assert.equal(await evaluate(`document.querySelectorAll('#page script, #page img').length`), 0);
  await submit('create-event', { name: 'Meeting <script>alert(1)</script>' });
  await submit('expense', { category: 'Supplies', amount: '27.97', description: 'Supplies' });
  assert.equal((await data()).events[0].Expenses.length, 1);
  assert.equal((await data()).events[1].Expenses[0].Amount, 27.97);
  await route('reports');
  await submit('event-report', { expected: 0, actual: 0, food: 'No food was served', leftovers: 0, rating: '4', repeat: 'Yes', notes: 'Review notes' });
  assert.ok(await evaluate(`document.querySelector('#page').textContent.includes('N/A')`));
  await route('fundraising');
  await submit('create-fundraiser', { name: 'Bake Sale', revenue: 60, expenses: 35 });
  await submit('fundraiser-report', { revenue: 60, expenses: 20, participants: 15, notes: 'Good turnout' });
  await submit('fundraiser-report', { revenue: 65, expenses: 20, participants: 15, notes: 'Corrected revenue' });
  await route('dashboard');
  assert.ok(await evaluate(`document.querySelector('#page').textContent.includes('$192.03')`));
  await send('Page.reload');
  await until(() => evaluate(`!!document.getElementById('budget')`));
  console.log('Creation, reports, calculations, and reload passed.');
  assert.equal((await data()).events.length, 2);
  await evaluate('window.confirm = () => false');
  await route('events'); await evaluate(`document.querySelector('[data-delete-event]').click()`);
  assert.equal((await data()).events.length, 2);
  await evaluate('window.confirm = () => true');
  await evaluate(`document.querySelector('[data-delete-expense]').click()`);
  assert.equal((await data()).events[0].Expenses.length, 0);
  // Export uses an actual browser download, then the same file format is reimported.
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
  console.log('Deletion confirmations passed. Testing backups.');
  await evaluate(`document.querySelector('#export').click()`);
  const exported = path.join(out, `mathclub-backup-${new Date().toISOString().slice(0, 10)}.json`);
  const backup = await until(async () => JSON.parse(await readFile(exported, 'utf8')));
  assert.deepEqual(backup, await data());
  await importFile('invalid.json', '{');
  await until(() => evaluate(`document.querySelector('#notice').textContent.includes('Import failed')`));
  assert.deepEqual(await data(), backup);
  await importFile('valid.json', JSON.stringify(backup));
  await until(() => evaluate(`document.querySelector('#notice').textContent.includes('Backup imported')`));
  assert.deepEqual(await data(), backup);
  // Quota failures keep the prior state and communicate failure.
  await route('dashboard');
  await evaluate(`window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function() { throw new Error('Quota exceeded'); }`);
  await submit('budget', { balance: 999 });
  assert.equal((await data()).starting_balance, 200);
  assert.ok(await evaluate(`document.querySelector('#notice').textContent.includes('Quota exceeded')`));
  await evaluate('Storage.prototype.setItem = window.originalSetItem');
  // Printable report contains the latest saved data, and fits a mobile viewport.
  await route('reports');
  await evaluate(`window.print = () => {}; document.querySelector('#print').click()`);
  const pdf = await send('Page.printToPDF', { printBackground: true });
  await writeFile(path.join(out, 'report.pdf'), Buffer.from(pdf.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const name of ['dashboard', 'events', 'fundraising', 'reports']) {
    await route(name);
    assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), `${name} overflows on mobile`);
  }
  await route('dashboard');
  await writeFile(path.join(out, 'mobile.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await writeFile(path.join(out, 'desktop.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  // Corrupt saved data remains recoverable and cannot be silently overwritten.
  await evaluate(`localStorage.setItem('mathclub.finance.v1', '{')`);
  await send('Page.reload');
  await until(() => evaluate(`document.querySelector('#storage-error')?.hidden === false`));
  assert.equal(await evaluate(`localStorage.getItem('mathclub.finance.v1')`), '{');
  assert.equal(await evaluate(`document.querySelector('#budget button').disabled`), true);
  await evaluate('window.confirm = () => true');
  await importFile('recovery.json', JSON.stringify(backup));
  await until(() => evaluate(`document.querySelector('#notice').textContent.includes('Backup imported')`));
  // A stale tab is blocked instead of silently overwriting a newer record.
  await evaluate(`window.dispatchEvent(new StorageEvent('storage', { key: 'mathclub.finance.v1' }))`);
  assert.equal(await evaluate(`document.querySelector('#budget button').disabled`), true);
  assert.deepEqual(exceptions, []);
  console.log('Browser checks passed: CRUD, duplicate names, escaped content, financial totals, reload persistence, deletion confirmation, JSON export/import, invalid import, quota failure, PDF, mobile layout, corrupt-data recovery, stale-tab protection.');
  console.log(`Screenshots and PDF: ${out}`);
} finally {
  socket?.close(); browser.kill();
  await new Promise(resolve => server.close(resolve));
}
