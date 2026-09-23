import { cents, eventCost, hasReport, totals, formatMoney as usd, escapeHtml as esc } from './model.js';
export function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function reportHtml(data) {
  const t = totals(data);
  const completed = data.events.filter(hasReport);
  const categories = new Map();
  for (const event of data.events) for (const x of event.Expenses) categories.set(x.Category, (categories.get(x.Category) ?? 0) + cents(x.Amount));
  const highlights = [];
  if (completed.length) {
    const attendance = [...completed].sort((a, b) => b.Report['Actual Attendance'] - a.Report['Actual Attendance'])[0];
    const rating = [...completed].sort((a, b) => b.Report['Event Rating'] - a.Report['Event Rating'])[0];
    highlights.push(`Highest attendance: ${attendance.Event} (${attendance.Report['Actual Attendance']}).`, `Highest rating: ${rating.Event} (${rating.Report['Event Rating']}/5).`);
    const attended = completed.filter(e => e.Report['Actual Attendance'] > 0).sort((a, b) => eventCost(a) / a.Report['Actual Attendance'] - eventCost(b) / b.Report['Actual Attendance']);
    if (attended.length) highlights.push(`Lowest cost per attendee: ${attended[0].Event} (${usd(eventCost(attended[0]) / attended[0].Report['Actual Attendance'])}).`);
  }
  return `<h2>Overall financial & event report</h2><p>Prepared ${esc(new Date().toLocaleDateString())} · USD</p>
    ${table(['Financial summary', 'Amount'], [['Starting balance', usd(cents(data.starting_balance))], ['Event spending', usd(t.spending)], ['Fundraising revenue', usd(t.revenue)], ['Fundraising expenses', usd(t.expenses)], ['Net fundraising profit', usd(t.profit)], ['Available balance', usd(t.balance)]])}
    <h3>Event performance</h3>${completed.length ? table(['Event', 'Cost', 'Attendance', 'Vs. expected', 'Cost / attendee', 'Rating'], completed.map(e => [e.Event, usd(eventCost(e)), e.Report['Actual Attendance'], e.Report['Expected Attendance'] ? `${(100 * e.Report['Actual Attendance'] / e.Report['Expected Attendance']).toFixed(1)}%` : 'N/A', e.Report['Actual Attendance'] ? usd(eventCost(e) / e.Report['Actual Attendance']) : 'N/A', `${e.Report['Event Rating']}/5`])) : '<p>No completed event reports yet.</p>'}
    ${highlights.map(line => `<p>${esc(line)}</p>`).join('')}
    <h3>Fundraising performance</h3>${data.fundraisers.length ? table(['Fundraiser', 'Predicted profit', 'Actual profit', 'Difference', 'Participants'], data.fundraisers.map(f => { const predicted = cents(f['Predicted Revenue']) - cents(f['Predicted Expenses']); const actual = hasReport(f) ? cents(f.Report['Actual Revenue']) - cents(f.Report['Actual Expenses']) : null; return [f.Fundraiser, usd(predicted), actual === null ? 'Pending' : usd(actual), actual === null ? 'N/A' : usd(actual - predicted), hasReport(f) ? f.Report.Participants : 'N/A']; })) : '<p>No fundraisers yet.</p>'}
    <h3>Spending by category</h3>${categories.size ? table(['Category', 'Amount'], [...categories].map(([name, amount]) => [name, usd(amount)])) : '<p>No expenses yet.</p>'}
    <h3>Event notes</h3>${completed.map(e => `<article><h4>${esc(e.Event)}</h4><p>Food: ${esc(e.Report['Food Result'])} · Leftover servings: ${e.Report['Leftover Servings']} · Host again: ${esc(e.Report['Host Again'])}</p><p class="notes">${esc(e.Report.Notes || 'No notes recorded.')}</p></article>`).join('')}
    <h3>Fundraiser notes</h3>${data.fundraisers.filter(hasReport).map(f => `<article><h4>${esc(f.Fundraiser)}</h4><p class="notes">${esc(f.Report.Notes || 'No notes recorded.')}</p></article>`).join('')}
    <section class="action-plan"><h2>Meeting review & action plan</h2>${['Event reflection & improvements', 'Club outreach & engagement', 'Upcoming event ideas', 'Short-term goals & owners'].map(title => `<h3>${title}</h3><div class="writing-box"></div>`).join('')}</section>`;
}
