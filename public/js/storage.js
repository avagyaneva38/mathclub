import { emptyData, validateData, MAX_FILE_BYTES } from './model.js';
export const STORAGE_KEY = 'mathclub.finance.v1';
export function parseBackup(raw) {
  if (new TextEncoder().encode(raw).length > MAX_FILE_BYTES) throw new Error('Backup exceeds the 2 MB limit.');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON.'); }
  return validateData(parsed);
}
export function loadData(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return { raw, data: raw === null ? emptyData() : parseBackup(raw) };
}
export function saveData(storage, data, expectedRaw) {
  const clean = validateData(data);
  const raw = JSON.stringify(clean);
  if (new TextEncoder().encode(raw).length > MAX_FILE_BYTES) throw new Error('Storage limit reached. Export a backup before removing old records.');
  if (storage.getItem(STORAGE_KEY) !== expectedRaw) throw new Error('Records changed in another tab. Reload this page before saving.');
  // Write before updating the visible state. Failed writes never claim success.
  storage.setItem(STORAGE_KEY, raw);
  return { raw, data: clean };
}
