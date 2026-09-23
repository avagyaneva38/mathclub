export const CATEGORIES = ['Food', 'Decorations', 'Equipment', 'Prizes', 'Supplies', 'Marketing', 'Other'];
export const FOOD_OPTIONS = ['Just enough', 'Too much', 'Not enough', 'No food was served'];
export const REPEAT_OPTIONS = ['Yes', 'Maybe', 'No'];
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const emptyData = () => ({ schema_version: 1, starting_balance: 0, events: [], fundraisers: [] });
export const newId = () => crypto.randomUUID();
const object = (x, label) => {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error(`${label} must be an object.`);
  return x;
};
function list(x, label) {
  if (!Array.isArray(x) || x.length > 2000) throw new Error(`${label} must be an array with at most 2,000 entries.`);
  return x;
}
export function textValue(x, label, max = 160, optional = false) {
  if (typeof x !== 'string' || x.length > max || (!optional && !x.trim())) throw new Error(`${label} must contain ${optional ? '0' : '1'}–${max} characters.`);
  return x.trim();
}
export function money(x, label = 'Amount') {
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 1e9 || Math.abs(x * 100 - Math.round(x * 100)) > 0.0001) throw new Error(`${label} must be a nonnegative amount up to $1 billion with at most two decimal places.`);
  return Math.round(x * 100) / 100;
}
const count = (x, label) => {
  if (!Number.isInteger(x) || x < 0 || x > 1000000) throw new Error(`${label} must be a whole number from 0 to 1,000,000.`);
  return x;
};
const choice = (x, options, label) => {
  if (!options.includes(x)) throw new Error(`${label} is not a recognized option.`);
  return x;
};
function report(raw, fundraising) {
  const r = object(raw ?? {}, 'Report');
  if (!Object.keys(r).length) return {};
  if (fundraising) return {
    'Actual Revenue': money(r['Actual Revenue'], 'Actual revenue'),
    'Actual Expenses': money(r['Actual Expenses'], 'Actual expenses'),
    Participants: count(r.Participants, 'Participants'),
    Notes: textValue(r.Notes ?? '', 'Notes', 10000, true)
  };
  const rating = count(r['Event Rating'], 'Event rating');
  if (rating < 1 || rating > 5) throw new Error('Event rating must be from 1 to 5.');
  return {
    'Expected Attendance': count(r['Expected Attendance'], 'Expected attendance'),
    'Actual Attendance': count(r['Actual Attendance'], 'Actual attendance'),
    'Food Result': choice(r['Food Result'], FOOD_OPTIONS, 'Food result'),
    'Leftover Servings': count(r['Leftover Servings'], 'Leftover servings'),
    'Event Rating': rating,
    'Host Again': choice(r['Host Again'], REPEAT_OPTIONS, 'Host again'),
    Notes: textValue(r.Notes ?? '', 'Notes', 10000, true)
  };
}
// Build a fresh allowlisted object: imported properties never become application code.
// Legacy Python backups have no version or IDs; both are added on import.
export function validateData(raw) {
  const d = object(raw, 'Backup');
  if (d.schema_version !== undefined && d.schema_version !== 1) throw new Error('Unsupported backup version.');
  const ids = new Set();
  function id(value) {
    const result = value === undefined ? newId() : textValue(value, 'Record ID', 100);
    if (ids.has(result)) throw new Error('Duplicate record IDs in backup.');
    ids.add(result);
    return result;
  }
  const result = {
    schema_version: 1,
    starting_balance: money(d.starting_balance, 'Starting balance'),
    events: list(d.events, 'Events').map(rawEvent => {
      const e = object(rawEvent, 'Event');
      return {
        id: id(e.id), Event: textValue(e.Event, 'Event name'),
        Expenses: list(e.Expenses, 'Expenses').map(rawExpense => {
          const x = object(rawExpense, 'Expense');
          const amount = money(x.Amount);
          if (!amount) throw new Error('Expense amount must be greater than zero.');
          return { id: id(x.id), Category: textValue(x.Category, 'Category'), Description: textValue(x.Description ?? '', 'Description', 500, true), Amount: amount };
        }), Report: report(e.Report, false)
      };
    }),
    fundraisers: list(d.fundraisers, 'Fundraisers').map(rawFundraiser => {
      const f = object(rawFundraiser, 'Fundraiser');
      return { id: id(f.id), Fundraiser: textValue(f.Fundraiser, 'Fundraiser name'),
        'Predicted Expenses': money(f['Predicted Expenses'], 'Predicted expenses'),
        'Predicted Revenue': money(f['Predicted Revenue'], 'Predicted revenue'), Report: report(f.Report, true) };
    })
  };
  totals(result); // Also reject aggregate amounts beyond exact integer arithmetic.
  return result;
}
export const cents = x => Math.round(x * 100);
export const eventCost = e => e.Expenses.reduce((sum, x) => sum + cents(x.Amount), 0);
export const hasReport = x => Object.keys(x.Report).length > 0;
export function totals(d) {
  const spending = d.events.reduce((sum, e) => sum + eventCost(e), 0);
  const revenue = d.fundraisers.reduce((sum, f) => sum + (hasReport(f) ? cents(f.Report['Actual Revenue']) : 0), 0);
  const expenses = d.fundraisers.reduce((sum, f) => sum + (hasReport(f) ? cents(f.Report['Actual Expenses']) : 0), 0);
  const profit = revenue - expenses;
  const balance = cents(d.starting_balance) - spending + profit;
  if (![spending, revenue, expenses, profit, balance].every(Number.isSafeInteger)) throw new Error('The combined amounts are too large.');
  return { spending, revenue, expenses, profit, balance };
}
export const formatMoney = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
