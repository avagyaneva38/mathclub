
import {
  CATEGORIES, FOOD_OPTIONS, REPEAT_OPTIONS, MAX_FILE_BYTES,
  emptyData, newId, cents, eventCost, hasReport, totals,
  formatMoney as usd, escapeHtml as esc, validateData
} from './model.js';
import { parseBackup, STORAGE_KEY } from './storage.js';
import { supabase } from './supabase.js';
import { table, reportHtml } from './reports.js';

let state = { data: emptyData(), version: null };
let authenticated = false;
let saving = false;
let blocked = false;
let eventId = '';
let eventOpen = false;
let eventEditing = false;
let reportPage = 'list';
let reportId = '';
let budgetEditing = false;
let fundraiserId = '';
let recoveryMode = false;
let galleryItems = [];
let galleryLoaded = false;
let galleryLoading = false;
let galleryUploadOpen = false;
const GALLERY_BUCKET = 'math-club-gallery';
async function loadGallery() {
  if (galleryLoading) return;
  galleryLoading = true;
  try {
    const { data, error } = await supabase.from('gallery_photos')
      .select('id,title,description,event_date,storage_path,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    galleryItems = data ?? [];
    galleryLoaded = true;
  } catch (error) {
    tell('Gallery could not be loaded: ' + error.message, true);
  } finally {
    galleryLoading = false;
    if (authenticated && location.hash === '#gallery') render();
  }
}
function gallery() {
  const cards = galleryItems.map(item => {
    const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(item.storage_path);
    return `<article class="gallery-item">
      <img src="${esc(data.publicUrl)}" alt="${esc(item.title)}" loading="lazy">
      <div class="gallery-item-body"><h2>${esc(item.title)}</h2>
      ${item.event_date ? `<time>${esc(item.event_date)}</time>` : ''}
      <p>${esc(item.description || '')}</p>
      <button class="subtle danger" data-gallery-delete="${esc(item.id)}" type="button">Delete photo</button>
      </div></article>`;
  }).join('');
  return `<header class="gallery-header"><h1>Gallery</h1>
    <p>Highlights from our events, meetings, and club activities!</p></header>
    <div class="gallery-toolbar"><button type="button" id="gallery-add">+ Add Photo</button></div>
    <form id="gallery-upload" class="card gallery-upload" ${galleryUploadOpen ? '' : 'hidden'}>
      <h2>Add a Math Club memory</h2>
      <label>Photo<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></label>
      <label>Title<input name="title" maxlength="100" required></label>
      <label>Event date (optional)<input type="date" name="event_date"></label>
      <label>Description<textarea name="description" maxlength="500" rows="3"></textarea></label>
      <button type="submit">Upload Photo</button>
    </form>
    ${!galleryLoaded ? '<p class="gallery-status">Loading photos…</p>' :
      cards ? `<div class="gallery-grid">${cards}</div>` :
      '<p class="empty gallery-status">No photos yet. Add your first Math Club memory!</p>'}`;
}


const page = document.querySelector('#page');
const notice = document.querySelector('#notice');
const $ = selector => document.querySelector(selector);

function tell(message, error = false) {
  notice.textContent = message;
  notice.className = error ? 'message error' : 'message';
}

async function fetchFinances() {
  const { data, error } = await supabase
    .from('club_finances')
    .select('data, version')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return {
    data: validateData(data.data),
    version: data.version
  };
}

async function saveFinances(draft, message) {
  if (!authenticated || blocked || saving) {
    throw new Error('Editing is currently unavailable.');
  }

  saving = true;
  try {
    const clean = validateData(draft);
    const { data: version, error } = await supabase.rpc(
      'save_club_finances',
      {
        expected_version: state.version,
        new_data: clean
      }
    );
    if (error) throw error;

    state = { data: clean, version };
    render();
    tell(message);
  } catch (error) {
    if (/changed|version/i.test(error.message)) {
      blocked = true;
      render();
      tell('Someone else saved changes. Reload before editing again.', true);
    }
    throw error;
  } finally {
    saving = false;
    // Refresh after the save completes so controls are not left disabled.
    if (authenticated) render();
  }
}

async function commit(change, message) {
  if (blocked || saving) {
    throw new Error('Wait for the current save or reload.');
  }
  const draft = structuredClone(state.data);
  change(draft);
  await saveFinances(draft, message);
}

// LOGIN AND PASSWORD RECOVERY

function showLogin(message = '') {
  authenticated = false;
  state = { data: emptyData(), version: null };
  $('#app-shell').hidden = true;
  $('#password-screen').hidden = true;
  $('#login-screen').hidden = false;
  $('#print-report').innerHTML = '';
  $('#login-error').textContent = message;
}

function showPasswordScreen() {
  authenticated = false;
  $('#app-shell').hidden = true;
  $('#login-screen').hidden = true;
  $('#password-screen').hidden = false;
  $('#password-error').textContent = '';
}

async function showAuthorizedDashboard() {
  state = await fetchFinances();
  authenticated = true;
  blocked = false;
  $('#login-screen').hidden = true;
  $('#password-screen').hidden = true;
  $('#app-shell').hidden = false;
  $('#storage-error').hidden = true;
  render();
}

// Recovery events can arrive after the initial session check.
supabase.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryMode = true;
    showPasswordScreen();
  }
});

async function initializeAuth() {
  showLogin();

  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const recoveryLink =
    fragment.get('type') === 'recovery' ||
    url.searchParams.get('type') === 'recovery';

  const { data: { session }, error } =
    await supabase.auth.getSession();

  if (error) {
    showLogin(error.message);
    return;
  }

  if (recoveryMode || (recoveryLink && session)) {
    recoveryMode = true;
    showPasswordScreen();
    return;
  }

  if (!session) return;

  try {
    await showAuthorizedDashboard();
  } catch {
    showLogin('Your account is not approved, or shared records could not be loaded.');
  }
}

$('#password-form').addEventListener('submit', async event => {
  event.preventDefault();

  const password = $('#new-password').value;
  const confirmation = $('#confirm-password').value;
  const errorBox = $('#password-error');
  const button = event.target.querySelector('button[type="submit"]');

  if (password !== confirmation) {
    errorBox.textContent = 'Passwords do not match.';
    return;
  }
  if (password.length < 12) {
    errorBox.textContent = 'Use at least 12 characters.';
    return;
  }

  button.disabled = true;
  errorBox.textContent = 'Saving your password...';

  try {
    const { data: { session }, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) {
      throw new Error('Your recovery session expired. Request a new recovery email.');
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    event.target.reset();
    recoveryMode = false;

    // Remove recovery tokens from the URL.
    history.replaceState(null, '', window.location.pathname);

    try {
      await showAuthorizedDashboard();
    } catch {
      await supabase.auth.signOut();
      showLogin('Password saved. Sign in with your new password.');
    }
  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();

  const errorBox = $('#login-error');
  errorBox.textContent = 'Signing in...';

  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorBox.textContent = error.message;
    return;
  }

  try {
    await showAuthorizedDashboard();
  } catch {
    await supabase.auth.signOut();
    showLogin('Your account is not approved, or shared records could not be loaded.');
  }
});

$('#logout-button').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    tell(error.message, true);
    return;
  }
  showLogin('Signed out.');
});

// DASHBOARD HTML HELPERS

const heading = (title, description) =>
  `<header><h1>${title}</h1><p>${description}</p></header>`;

const input = (name, label, value = '', type = 'text', extra = '') =>
  `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra} required></label>`;

const cash = (name, label, value = 0, positive = false) =>
  input(name, label, value, 'number',
    `min="${positive ? '0.01' : '0'}" max="1000000000" step="0.01"`);

const integer = (name, label, value = 0) =>
  input(name, label, value, 'number', 'min="0" max="1000000" step="1"');

const select = (name, label, options, value) =>
  `<label>${label}<select name="${name}" required>${options.map(
    x => `<option ${x === value ? 'selected' : ''}>${esc(x)}</option>`
  ).join('')}</select></label>`;

const notes = value =>
  `<label>Notes<textarea name="notes" maxlength="10000" rows="4">${esc(value ?? '')}</textarea></label>`;

const metric = (label, value) =>
  `<div class="metric"><span>${label}</span><strong>${esc(value)}</strong></div>`;

const eventDate = e => e.Date ? new Date(e.Date + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

const picker = (id, label, records, key, selected) =>
  `<label>${label}<select id="${id}">${records.map(
    (x, i) =>
      `<option value="${esc(x.id)}" ${x.id === selected ? 'selected' : ''}>${esc(x[key])} · #${i + 1}</option>`
  ).join('')}</select></label>`;

function currentEvent() {
  return state.data.events.find(e => e.id === eventId)
    ?? state.data.events[0];
}

function currentFundraiser() {
  return state.data.fundraisers.find(f => f.id === fundraiserId)
    ?? state.data.fundraisers[0];
}

// DASHBOARD

function dashboard() {
  const d = state.data; const t = totals(d);
  return heading('Finance dashboard', 'A clear view of your club’s budget, events, and fundraising.') +
    `<div class="metrics">${metric('Annual budget', usd(cents(d.starting_balance) + d.additional_funding.reduce((sum, f) => sum + cents(f.amount), 0)))}${metric('Event expenses', usd(t.spending))}${metric('Available balance', usd(t.balance))}</div>
    ${t.balance < 0 ? '<p class="message error">Recorded spending exceeds the available budget.</p>' : ''}
    <section class="card"><h2>Events at a glance</h2>${d.events.length ? table(['Event', 'Expenses', 'Total cost', 'Date'], d.events.map(e => [e.Event, e.Expenses.length, usd(eventCost(e)), eventDate(e)])) : '<p class="empty">Your ledger starts here. <a href="#events">Create your first event</a> or import your existing JSON backup.</p>'}</section>
    <div class="columns"><section class="card annual-budget-card"><h2>Annual budget</h2>
    <p class="total">Starting balance: <strong>${usd(cents(d.starting_balance))}</strong></p>
    ${d.additional_funding.length ? `<h3>Additional funding</h3><div class="table-wrap"><table><thead><tr><th>Source</th><th>Amount</th>${budgetEditing ? '<th>Action</th>' : ''}</tr></thead><tbody>${d.additional_funding.map(f => `<tr><td>${esc(f.name)}</td><td>${usd(cents(f.amount))}</td>${budgetEditing ? `<td><button type="button" class="subtle danger" data-delete-funding="${esc(f.id)}">Remove</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : ''}
    ${d.additional_funding.length ? `<p class="total">Total annual budget: <strong>${usd(cents(d.starting_balance) + d.additional_funding.reduce((sum, f) => sum + cents(f.amount), 0))}</strong></p>` : ''}
    ${budgetEditing ? `<form id="budget">${cash('balance', 'Starting balance', d.starting_balance)}<button>Save Budget</button></form><form id="funding"><h3>Add additional funding</h3><div class="form-grid">${input('name', 'Funding source', '', 'text', 'maxlength="160" placeholder="e.g. Student Government grant"')}${cash('amount', 'Amount received', '', true)}</div><button>Add Funding</button></form>` : ''}
    <div class="budget-edit-action"><button type="button" class="subtle" id="budget-toggle">${budgetEditing ? 'Done Editing' : 'Edit Budget'}</button></div>
    </section>
    <section class="card"><h2>Fundraising</h2><dl><dt>Actual revenue</dt><dd>${usd(t.revenue)}</dd><dt>Actual expenses</dt><dd>${usd(t.expenses)}</dd><dt>Net profit</dt><dd>${usd(t.profit)}</dd></dl><p class="muted">Only completed fundraiser reports affect your balance.</p></section></div>
`;
}
function events() {
  const e = state.data.events.find(item => item.id === eventId);
  const list = heading('Events', 'Create an event or select one to see its details.') +
    `<section class="card"><h2>Create Event</h2><form id="create-event" class="inline">${input('name', 'Event name', '', 'text', 'maxlength="160" placeholder="e.g. Math Made Sweet"')}<button>Create Event</button></form></section>
    <section class="card"><h2>Events</h2>${state.data.events.length ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Expenses</th><th>Total cost</th><th>Date</th><th></th></tr></thead><tbody>${state.data.events.map(item => `<tr><td><button type="button" class="event-link" data-open-event="${esc(item.id)}">${esc(item.Event)}</button></td><td>${item.Expenses.length}</td><td>${usd(eventCost(item))}</td><td>${esc(eventDate(item))}</td><td><button type="button" class="subtle" data-open-event="${esc(item.id)}">View</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No events yet. Create your first event above.</p>'}</section>`;
  if (!eventOpen || !e) return list;
  const r = e.Report ?? {};
  const reportDetails = hasReport(e) ? `<dl>
    <dt>Expected attendance</dt><dd>${esc(r['Expected Attendance'])}</dd>
    <dt>Actual attendance</dt><dd>${esc(r['Actual Attendance'])}</dd>
    <dt>Food</dt><dd>${esc(r['Food Result'])}</dd>
    <dt>Leftover servings</dt><dd>${esc(r['Leftover Servings'])}</dd>
    <dt>Event rating</dt><dd>${esc(r['Event Rating'])} / 5</dd>
    <dt>Host again?</dt><dd>${esc(r['Host Again'])}</dd>
    <dt>Notes</dt><dd class="notes">${esc(r.Notes || 'None')}</dd></dl>` : '<p class="muted">No event report has been added yet.</p>';
  return heading('Event details', 'Review event information before making changes.') +
    `<div class="card-actions event-toolbar"><button type="button" class="subtle" id="back-to-events">← All Events</button>
    ${eventEditing ? '<button type="button" class="subtle" id="cancel-event-edit">Done Editing</button>' : '<button type="button" id="edit-event">Edit Event</button>'}</div>
    <section class="card"><h2>${esc(e.Event)}</h2><p class="muted">Date: ${esc(eventDate(e))}</p><p class="total">Total spending: ${usd(eventCost(e))}</p>
    ${eventEditing ? `<form id="rename-event" class="inline">${input('name', 'Event name', e.Event, 'text', 'maxlength="160"')}<label>Event date<input type="date" name="date" value="${esc(e.Date ?? '')}"></label><button>Save Event Details</button></form>` : ''}
    <h3>Recorded expenses</h3>
    ${e.Expenses.length ? `<div class="table-wrap"><table><thead><tr><th>Category</th><th>Description</th><th>Amount</th>${eventEditing ? '<th>Action</th>' : ''}</tr></thead><tbody>${e.Expenses.map(x => `<tr><td>${esc(x.Category)}</td><td>${esc(x.Description)}</td><td>${usd(cents(x.Amount))}</td>${eventEditing ? `<td><button type="button" class="subtle danger" data-delete-expense="${esc(x.id)}">Delete</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="muted">No expenses recorded yet.</p>'}
    ${eventEditing ? `<form id="expense"><h3>Add expense</h3><div class="form-grid">${select('category', 'Category', CATEGORIES)}${cash('amount', 'Amount', '', true)}</div><label>Description<input name="description" maxlength="500" placeholder="e.g. Pizza"></label><button>Add Expense</button></form>` : ''}
    <h3>Event report</h3>
    ${eventEditing ? `<form id="event-report"><div class="form-grid">${integer('expected', 'Expected attendance', r['Expected Attendance'] ?? 0)}${integer('actual', 'Actual attendance', r['Actual Attendance'] ?? 0)}${select('food', 'How was the amount of food?', FOOD_OPTIONS, r['Food Result'])}${integer('leftovers', 'Leftover servings', r['Leftover Servings'] ?? 0)}${select('rating', 'Overall event success (1–5)', ['1', '2', '3', '4', '5'], String(r['Event Rating'] ?? 3))}${select('repeat', 'Would you host this event again?', REPEAT_OPTIONS, r['Host Again'])}</div>${notes(r.Notes)}<button>Save Event Report</button></form>` : reportDetails}
    ${eventEditing ? `<div class="card-actions"><button type="button" class="danger" data-delete-event="${esc(e.id)}">Delete Event</button></div>` : ''}</section>`;
}

// FUNDRAISING

function fundraising() {
  const f = currentFundraiser();
  if (f) fundraiserId = f.id;

  const r = f?.Report ?? {};
  const predicted = f
    ? cents(f['Predicted Revenue']) - cents(f['Predicted Expenses'])
    : 0;

  const actual = f && hasReport(f)
    ? cents(r['Actual Revenue']) - cents(r['Actual Expenses'])
    : null;

  return heading(
    'Fundraising',
    'Plan ahead, then record what your fundraiser actually earned.'
  ) +
  `<section class="card">
    <h2>Plan fundraiser</h2>
    <p class="muted">
      Planning figures do not change your available balance.
    </p>
    <form id="create-fundraiser">
      ${input('name', 'Fundraiser name', '', 'text', 'maxlength="160"')}
      <div class="form-grid">
        ${cash('revenue', 'Predicted revenue')}
        ${cash('expenses', 'Predicted expenses')}
      </div>
      <button>Plan fundraiser</button>
    </form>
  </section>` +
  (f
    ? `<section class="card">
      ${picker('fundraiser-picker', 'Manage fundraiser',
        state.data.fundraisers, 'Fundraiser', f.id)}
      <h2>${esc(f.Fundraiser)}</h2>
      <div class="metrics">
        ${metric('Predicted revenue',
          usd(cents(f['Predicted Revenue'])))}
        ${metric('Predicted expenses',
          usd(cents(f['Predicted Expenses'])))}
        ${metric('Predicted profit', usd(predicted))}
      </div>
      ${actual !== null
        ? `<p class="total">
          Actual profit: ${usd(actual)} ·
          Difference from prediction: ${usd(actual - predicted)}
        </p>`
        : ''}
      <form id="fundraiser-report">
        <h3>${hasReport(f) ? 'Edit' : 'Add'} actual results</h3>
        <div class="form-grid">
          ${cash('revenue', 'Actual revenue',
            r['Actual Revenue'] ?? 0)}
          ${cash('expenses', 'Actual expenses',
            r['Actual Expenses'] ?? 0)}
          ${integer('participants', 'Participants',
            r.Participants ?? 0)}
        </div>
        ${notes(r.Notes)}
        <button>Save fundraiser report</button>
      </form>
      <div class="card-actions">
        <button class="danger"
          data-delete-fundraiser="${esc(f.id)}">
          Delete fundraiser
        </button>
      </div>
    </section>`
    : '<p class="empty">No fundraisers planned yet.</p>');
}

// REPORTS

function reports() {
  if (reportPage === 'meeting') return heading('Meeting report', 'Review and print your meeting summary.') +
    `<div class="card-actions event-toolbar"><button type="button" id="reports-back" class="subtle">← All Reports</button><button type="button" id="print">Print / Save PDF</button></div><section class="card"><div class="report-preview">${reportHtml(state.data)}</div></section>`;
  const e = state.data.events.find(x => x.id === reportId);
  if (reportPage === 'event' && e) {
    const r = e.Report ?? {};
    return heading(esc(e.Event), 'Complete or update this event report.') +
      `<div class="card-actions event-toolbar"><button type="button" id="reports-back" class="subtle">← All Reports</button></div>
      <section class="card"><h2>${hasReport(e) ? 'Edit report' : 'Complete report'}</h2><form id="event-report"><div class="form-grid">
      ${integer('expected', 'Expected attendance', r['Expected Attendance'] ?? 0)}
      ${integer('actual', 'Actual attendance', r['Actual Attendance'] ?? 0)}
      ${select('food', 'How was the amount of food?', FOOD_OPTIONS, r['Food Result'])}
      ${integer('leftovers', 'Leftover servings', r['Leftover Servings'] ?? 0)}
      ${select('rating', 'Overall event success (1–5)', ['1','2','3','4','5'], String(r['Event Rating'] ?? 3))}
      ${select('repeat', 'Would you host this event again?', REPEAT_OPTIONS, r['Host Again'])}
      </div>${notes(r.Notes)}<button>Save Event Report</button></form></section>`;
  }
  return heading('Reports', 'Complete event reports and review meeting finances.') +
    `<section class="card"><h2>Event reports</h2>
    ${state.data.events.length ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${state.data.events.map(e => `<tr><td>${esc(e.Event)}</td><td>${hasReport(e) ? 'Complete' : 'Pending'}</td><td><button type="button" class="subtle" data-report-id="${esc(e.id)}">${hasReport(e) ? 'View / Edit Report' : 'Complete Report'}</button></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">Create an event in the Events tab to get started.</p>'}</section>
    <section class="card"><div class="card-actions"><div><h2>Meeting report</h2><p class="muted">Financial summary and printable PDF.</p></div><button type="button" id="meeting-open">View Meeting Report</button></div></section>`;
}

// RENDER AND NAVIGATION

function render() {
  if (!authenticated) return;

  const route = location.hash.slice(1);
  const views = { dashboard, events, fundraising, reports, gallery };
  const active = Object.hasOwn(views, route)
    ? route
    : 'dashboard';

  page.innerHTML = views[active]();
  if (active === 'gallery' && !galleryLoaded && !galleryLoading) void loadGallery();

  document.querySelectorAll('nav a').forEach(a => {
    if (a.hash === `#${active}`) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });

  if (blocked || saving) {
    page.querySelectorAll('input, select, textarea, button')
      .forEach(x => { x.disabled = true; });
  }
}

window.addEventListener('hashchange', () => {
  if (!authenticated) return;
  eventOpen = false;
  eventEditing = false;
  reportPage = 'list';
  tell('');
  render();
  $('#main').focus();
});

page.addEventListener('click', async event => {
  if (!authenticated) return;
  if (event.target.closest('#gallery-add')) {
    galleryUploadOpen = !galleryUploadOpen;
    render();
    return;
  }
  const del = event.target.closest('[data-gallery-delete]');
  if (!del) return;
  const item = galleryItems.find(x => x.id === del.dataset.galleryDelete);
  if (!item || !confirm('Delete this gallery photo?')) return;
  try {
    const { error } = await supabase.from('gallery_photos').delete().eq('id', item.id);
    if (error) throw error;
    const removed = await supabase.storage.from(GALLERY_BUCKET).remove([item.storage_path]);
    if (removed.error) tell('Photo entry deleted, but storage cleanup failed: ' + removed.error.message, true);
    galleryLoaded = false;
    await loadGallery();
  } catch (error) { tell('Could not delete photo: ' + error.message, true); }
});
page.addEventListener('submit', async event => {
  if (event.target.id !== 'gallery-upload') return;
  event.preventDefault();
  if (!authenticated) return;
  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const values = new FormData(form);
  const file = values.get('photo');
  if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024 ||
      !['image/jpeg','image/png','image/webp'].includes(file.type)) {
    tell('Choose a JPG, PNG or WebP image smaller than 8 MB.', true);
    return;
  }
  button.disabled = true;
  const ext = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp' }[file.type];
  const path = crypto.randomUUID() + '.' + ext;
  try {
    const uploaded = await supabase.storage.from(GALLERY_BUCKET).upload(path, file, {contentType:file.type});
    if (uploaded.error) throw uploaded.error;
    const { error } = await supabase.from('gallery_photos').insert({
      title: String(values.get('title') || '').trim(),
      description: String(values.get('description') || '').trim(),
      event_date: values.get('event_date') || null,
      storage_path: path
    });
    if (error) {
      await supabase.storage.from(GALLERY_BUCKET).remove([path]);
      throw error;
    }
    galleryUploadOpen = false;
    galleryLoaded = false;
    await loadGallery();
    tell('Photo added to the gallery.');
  } catch (error) {
    tell('Photo upload failed: ' + error.message, true);
    button.disabled = false;
  }
});
page.addEventListener('change', event => {
  if (event.target.id === 'event-picker') {
    eventId = event.target.value;
    render();
  }
  if (event.target.id === 'fundraiser-picker') {
    fundraiserId = event.target.value;
    render();
  }
});

// FORM SUBMISSIONS

page.addEventListener('submit', async event => {
  event.preventDefault();
  if (!authenticated) return;

  const form = event.target;
  const values = new FormData(form);
  const s = key => String(values.get(key) ?? '').trim();
  const n = key => Number(s(key));

  try {
    switch (form.id) {
      case 'funding':
        await commit(d => { d.additional_funding.push({ id: newId(), name: s('name'), amount: n('amount') }); }, 'Additional funding added.');
        break;

      case 'budget':
        await commit(
          d => { d.starting_balance = n('balance'); },
          'Budget saved.'
        );
        break;

      case 'create-event': {
        const id = newId();
        await commit(
          d => {
            d.events.push({
              id,
              Event: s('name'),
              Date: '',
              Expenses: [],
              Report: {}
            });
          },
          'Event created.'
        );
        eventId = id;
        eventOpen = false;
        eventEditing = false;
        render();
        break;
      }

      case 'rename-event':
        await commit(d => { const e = d.events.find(e => e.id === eventId); e.Event = s('name'); e.Date = s('date'); }, 'Event details saved.');
        break;

      case 'expense':
        await commit(
          d => {
            d.events.find(e => e.id === eventId)
              .Expenses.push({
                id: newId(),
                Category: s('category'),
                Description: s('description'),
                Amount: n('amount')
              });
          },
          'Expense saved.'
        );
        break;

      case 'create-fundraiser': {
        const id = newId();
        await commit(
          d => {
            d.fundraisers.push({
              id,
              Fundraiser: s('name'),
              'Predicted Revenue': n('revenue'),
              'Predicted Expenses': n('expenses'),
              Report: {}
            });
          },
          'Fundraiser planned.'
        );
        fundraiserId = id;
        render();
        break;
      }

      case 'event-report':
        await commit(
          d => {
            d.events.find(e => e.id === (reportPage === 'event' ? reportId : eventId)).Report = {
              'Expected Attendance': n('expected'),
              'Actual Attendance': n('actual'),
              'Food Result': s('food'),
              'Leftover Servings': n('leftovers'),
              'Event Rating': n('rating'),
              'Host Again': s('repeat'),
              Notes: s('notes')
            };
          },
          'Event report saved.'
        );
        break;

      case 'fundraiser-report':
        await commit(
          d => {
            d.fundraisers.find(f => f.id === fundraiserId).Report = {
              'Actual Revenue': n('revenue'),
              'Actual Expenses': n('expenses'),
              Participants: n('participants'),
              Notes: s('notes')
            };
          },
          'Fundraiser report saved.'
        );
        break;
    }
  } catch (error) {
    tell(error.message, true);
  }
});

// BUTTON ACTIONS

page.addEventListener('click', async event => {
  if (!authenticated) return;

  const button = event.target.closest('button');
  if (!button) return;

  try {
    if (button.id === 'budget-toggle') { budgetEditing = !budgetEditing; render(); return; }
    if (button.dataset.deleteFunding && confirm('Remove this additional funding entry?')) {
      await commit(d => { d.additional_funding = d.additional_funding.filter(f => f.id !== button.dataset.deleteFunding); }, 'Funding entry removed.');
      return;
    }
    if (button.dataset.reportId) { reportId = button.dataset.reportId; reportPage = 'event'; render(); return; }
    if (button.id === 'meeting-open') { reportPage = 'meeting'; render(); return; }
    if (button.id === 'reports-back') { reportPage = 'list'; render(); return; }
    if (button.dataset.openEvent) { eventId = button.dataset.openEvent; eventOpen = true; eventEditing = false; render(); return; }
    if (button.id === 'back-to-events') { eventOpen = false; eventEditing = false; render(); return; }
    if (button.id === 'edit-event') { eventEditing = true; render(); return; }
    if (button.id === 'cancel-event-edit') { eventEditing = false; render(); return; }
    if (button.id === 'print') {
      $('#print-report').innerHTML = reportHtml(state.data);
      window.print();
    }

    if (
      button.dataset.deleteEvent &&
      confirm('Delete this event, all its expenses, and its report?')
    ) {
      await commit(
        d => {
          d.events = d.events.filter(
            e => e.id !== button.dataset.deleteEvent
          );
        },
        'Event deleted.'
      );
      eventOpen = false;
      eventEditing = false;
      render();
    }

    if (
      button.dataset.deleteExpense &&
      confirm('Delete this expense?')
    ) {
      await commit(
        d => {
          const e = d.events.find(e => e.id === eventId);
          e.Expenses = e.Expenses.filter(
            x => x.id !== button.dataset.deleteExpense
          );
        },
        'Expense deleted.'
      );
    }

    if (
      button.dataset.deleteFundraiser &&
      confirm('Delete this fundraiser and its report?')
    ) {
      await commit(
        d => {
          d.fundraisers = d.fundraisers.filter(
            f => f.id !== button.dataset.deleteFundraiser
          );
        },
        'Fundraiser deleted.'
      );
    }
  } catch (error) {
    tell(error.message, true);
  }
});

// BACKUPS

function download(raw, filename) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: 'application/json' })
  );

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('#export').addEventListener('click', () => {
  if (!authenticated) return;

  download(
    JSON.stringify(state.data, null, 2),
    `mathclub-backup-${new Date().toISOString().slice(0, 10)}.json`
  );

  tell('Backup download started. Keep the file somewhere safe.');
});

$('#recovery').addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      throw new Error('No old browser records were found.');
    }
    download(raw, 'mathclub-old-browser-recovery.json');
  } catch (error) {
    tell(error.message, true);
  }
});

$('#import-trigger').addEventListener(
  'click',
  () => $('#import').click()
);

$('#import').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error('Choose a JSON backup smaller than 2 MB.');
    }

    const imported = parseBackup(await file.text());

    if (!confirm(
      `Import ${imported.events.length} events and ` +
      `${imported.fundraisers.length} fundraisers? ` +
      'This replaces the SHARED database records for every ' +
      'e-board member. Export a backup first.'
    )) return;

    await saveFinances(
      imported,
      'Backup imported into shared records.'
    );

    eventId = '';
    fundraiserId = '';
    render();
  } catch (error) {
    tell(`Import failed: ${error.message}`, true);
  } finally {
    event.target.value = '';
  }
});

// START APPLICATION
const PREVIEW_URL =
  'https://mathclub-bv66p9e6b-eva-b822.vercel.app/';

async function requestPasswordRecovery(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PREVIEW_URL
  });

  if (error) throw error;
}

document.querySelector('#forgot-password').addEventListener(
  'click',
  async () => {
    const email = document.querySelector('#login-email').value.trim();
    const message = document.querySelector('#login-error');

    if (!email) {
      message.textContent =
        'Enter your email address above, then click Forgot Password.';
      return;
    }

    message.textContent = 'Sending recovery email...';

    try {
      await requestPasswordRecovery(email);
      message.textContent =
        'If this email has an account, a password recovery link will be sent.';
    } catch (error) {
      message.textContent = error.message;
    }
  }
);

initializeAuth();
