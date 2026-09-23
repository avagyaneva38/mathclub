# Math Club Finance

A browser-only prototype for club budgets, event expenses, fundraising, and meeting reports. Uses plain HTML, CSS, and JavaScript; no React, database, API keys, or production dependencies are required.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `avagyaneva38/mathclub` from GitHub.
2. Keep the **Root Directory** at the repository root and choose **Other** as the framework.
3. Leave **Build Command** empty and use **public** as the **Output Directory**. These settings are already in `vercel.json`.
4. Deploy. No environment variables are needed.

Only `public/` is served. The Python source, tests, and local JSON records are not website assets. See [Vercel project configuration](https://vercel.com/docs/project-configuration).

## Run locally

Install [Node.js](https://nodejs.org/) 22 or newer, then run from this folder:

```sh
npm start
```

Open **http://localhost:3000**. No `npm install` is necessary. Use the local server rather than opening `index.html` directly, because the app uses JavaScript modules.

## Bring your current records over

Open **Backups** in the footer, choose **Import JSON**, and select your existing `math_club_data.json`. The importer accepts the original Python format and adds stable record IDs. Confirm the import to replace this browser's records. Your original file is not modified.

The site starts with an empty ledger. `math_club_data.json` is intentionally ignored by Git so actual club records are not published. Use **Backups → Export JSON** regularly. Exports include all event and fundraiser reports and can be imported again.

Records are saved in this browser's local storage for this exact site address. They are **not shared between people, devices, browsers, localhost, Vercel preview URLs, or your production URL**. Clearing site data deletes them. Private browsing may discard them when closed. This prototype has no accounts or server backup.

## Features

- Starting budget, event spending, and actual fundraising profit, calculated in integer cents.
- Create/delete events and add/delete individual expenses.
- Plan fundraisers and create or edit their actual results.
- Event reports with attendance, food, ratings, repeat plans, and notes.
- Meeting reports with category spending, comparisons, highlights, and an action-plan worksheet.
- **Print / Save PDF** uses the browser print dialog; select **Save as PDF** for a downloadable report.
- Validated JSON import/export, storage failure messages, corrupted-data recovery download, and stale-tab protection.
- Responsive layout, labeled forms, keyboard navigation, and security headers.

Amounts use USD and at most two decimal places. Expenses must be positive. Backup files are limited to 2 MB; each collection is limited to 2,000 entries. An undefined attendance ratio is shown as N/A.

## Project layout

```text
public/index.html       Page shell and navigation
public/styles.css      Layout, theme, mobile and print styling
public/js/app.js        Forms, navigation, and user interactions
public/js/model.js      Validation and financial calculations
public/js/storage.js    Browser persistence and backup parsing
public/js/reports.js    Tables and printable reports
scripts/serve.mjs       Local static server (only serves public/)
scripts/browser-test.mjs Optional Chrome/Edge workflow checks
tests/                 Calculation, validation, storage, and server tests
vercel.json            Static deployment and security headers
app.py                 Original Streamlit app, retained for reference
AUDIT.md               Findings and prototype limitations
```

`app.py` is the original implementation, not the Vercel entry point. Its known issues are documented in `AUDIT.md`; use the new browser app for this deployment. The separately opened file in Downloads was not modified.

## Verify changes

```sh
npm test
npm run test:browser
```

The first command uses Node's built-in test runner. Browser checks require an installed Chrome or Edge and use a separate temporary profile; set `CHROME_PATH` if the executable is not in a common location. Browser checks write screenshots, a PDF, and synthetic backups to the ignored `test-results/` folder. They do not use your personal browser profile or club records.

For shared club use later, add authenticated accounts and a server database before treating this as a multi-user system. Browser storage offers no cross-device synchronization; stale-tab checks reduce accidental overwrites but are not database transactions.
