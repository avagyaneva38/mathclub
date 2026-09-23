import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, validateData, totals, eventCost, escapeHtml } from '../public/js/model.js';
import { parseBackup, saveData, loadData, STORAGE_KEY } from '../public/js/storage.js';
import { reportHtml } from '../public/js/reports.js';

function fixture() {
  return { starting_balance: 200, events: [
    { Event: 'Meeting', Expenses: [{ Category: 'Food', Description: 'Pizza', Amount: 25 }], Report: {} },
    { Event: 'Meeting', Expenses: [{ Category: 'Food', Description: 'Snacks', Amount: 23.97 }, { Category: 'Decorations', Description: 'Tablecloth', Amount: 4 }], Report: {} }
  ], fundraisers: [{ Fundraiser: 'Bake sale', 'Predicted Revenue': 60, 'Predicted Expenses': 35, Report: { 'Actual Revenue': 60, 'Actual Expenses': 20, Participants: 15, Notes: '' } }] };
}
function memoryStorage(raw = null) {
  return { getItem: () => raw, setItem: (key, value) => { assert.equal(key, STORAGE_KEY); raw = value; } };
}
test('migrates legacy backups and assigns unique IDs despite duplicate names', () => {
  const d = validateData(fixture());
  assert.equal(d.schema_version, 1);
  assert.notEqual(d.events[0].id, d.events[1].id);
  assert.deepEqual(validateData(d), d);
});
test('financial totals use integer cents and completed fundraiser results', () => {
  const d = validateData(fixture());
  assert.deepEqual(totals(d), { spending: 5297, revenue: 6000, expenses: 2000, profit: 4000, balance: 18703 });
  d.fundraisers[0].Report = {};
  assert.equal(totals(d).balance, 14703);
  d.events[0].Expenses = [{ Amount: 0.1 }, { Amount: 0.2 }];
  assert.equal(eventCost(d.events[0]), 30);
});
test('rejects invalid structures, versions, amounts, reports and duplicate IDs', () => {
  for (const x of [null, [], {}, { ...emptyData(), schema_version: 2 }, { ...emptyData(), events: {} }]) assert.throws(() => validateData(x));
  for (const x of [-1, Infinity, NaN, '20', 0.001, 1000000001]) assert.throws(() => validateData({ ...emptyData(), starting_balance: x }));
  const d = fixture(); d.events[0].Report = { Notes: 'Incomplete' };
  assert.throws(() => validateData(d));
  const duplicate = validateData(fixture()); duplicate.events[1].id = duplicate.events[0].id;
  assert.throws(() => validateData(duplicate), /Duplicate/);
});
test('missing legacy Report fields normalize to empty reports', () => {
  const d = fixture(); delete d.events[0].Report;
  assert.deepEqual(validateData(d).events[0].Report, {});
});
test('failed or conflicting storage writes do not overwrite existing records', () => {
  const storage = memoryStorage();
  const state = saveData(storage, fixture(), null);
  assert.deepEqual(loadData(storage), state);
  assert.throws(() => saveData(storage, emptyData(), null), /another tab/);
  assert.equal(storage.getItem(), state.raw);
  const failing = { getItem: () => state.raw, setItem: () => { throw new Error('Quota exceeded'); } };
  assert.throws(() => saveData(failing, emptyData(), state.raw), /Quota/);
  assert.equal(failing.getItem(), state.raw);
});
test('invalid or oversized JSON is rejected and corrupted storage is preserved', () => {
  assert.throws(() => parseBackup('{'), /valid JSON/);
  assert.throws(() => parseBackup(' '.repeat(2 * 1024 * 1024 + 1)), /2 MB/);
  const storage = memoryStorage('{');
  assert.throws(() => loadData(storage));
  assert.equal(storage.getItem(), '{');
});
test('reports escape user content and label zero-attendance ratios N/A', () => {
  const d = fixture();
  d.events[0].Event = '<img src=x onerror=alert(1)>';
  d.events[0].Report = { 'Expected Attendance': 0, 'Actual Attendance': 0, 'Food Result': 'No food was served', 'Leftover Servings': 0, 'Event Rating': 3, 'Host Again': 'Maybe', Notes: '<script>alert(1)</script>' };
  const html = reportHtml(validateData(d));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('N/A'));
  assert.equal(escapeHtml('"<&'), '&quot;&lt;&amp;');
});
test('unknown imported properties are discarded', () => {
  const d = JSON.parse('{"starting_balance":0,"events":[],"fundraisers":[],"__proto__":{"polluted":true}}');
  assert.deepEqual(validateData(d), emptyData());
  assert.equal({}.polluted, undefined);
});
