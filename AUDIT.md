# Prototype audit

Scope: the workspace's original `app.py` and data format, followed by the new static implementation. The original Python source is retained unchanged for reference. The deployment entry point is `public/index.html`.

## Original findings

| Finding | Impact | Resolution in the prototype |
| --- | --- | --- |
| Streamlit UI, global state, CSS, persistence, and PDF code are combined in a roughly 4,400-line file. | Hard to inspect and maintain; no deployment setup. | Separate page shell, styles, model, storage, UI, and report modules; static Vercel configuration. |
| `load_data` returns an empty dataset on JSON and OS errors (`app.py:426`). | A subsequent save can overwrite existing records after a failed read. | Fail visibly, preserve the raw storage value, block edits, and provide a recovery download and validated replacement import. |
| `save_data` overwrites a shared JSON file (`app.py:463`), with no concurrency control. | Sessions can overwrite each other's records; local-file persistence is unsuitable for the selected browser-only hosting model. | Browser storage, save-before-render behavior, stale-tab detection, and explicit export/import. |
| Events/fundraisers are selected by display name; duplicate names are allowed (`app.py:2854` and fundraising selection). | A duplicate name can resolve to the wrong record. | Unique IDs for events, fundraisers, and expenses, including migrated imports. |
| A second report implementation follows `return pdf_buffer` (`app.py:1673` through `2499`). | Hundreds of lines are unreachable. | One report renderer shared by preview and printing. |
| `overall_pdf` is cached without invalidation (`app.py:4349`). | Downloaded reports can reflect outdated figures. | Print content is generated from the latest saved state every time. |
| PDF paragraphs interpolate event names as ReportLab markup. | User text can break report formatting. | All user text is escaped before HTML rendering; no inline scripts or third-party scripts. |
| Data loaded from disk is not schema validated. | Missing fields, invalid amounts, or malformed reports can crash the app or distort results. | Strict import and save validation, finite amounts, integer attendance, report validation, size limits, and explicit schema version. |
| Floating-point money accumulation is repeated in multiple places. | Rounding inconsistencies and duplicated business logic. | Shared integer-cent calculations. |
| Event/fundraiser deletion is immediate. | Easy to delete related records by mistake. | Confirmation for record/expense deletion and replacement imports. |
| Completed fundraiser results cannot be edited through the original flow. | Mistakes are difficult to correct. | Saved fundraiser reports remain editable. |

## Intentional changes

- No Python runtime, React framework, build step, database, or external requests are needed by the deployed app.
- Local records are not seeded into the public site. Import the existing JSON through the footer's Backups menu.
- PDF export now uses the browser's Print / Save PDF dialog instead of ReportLab. Meeting reports are available even before two event reports are completed.
- Zero-attendance cost-per-person and zero-expected-attendance ratios display N/A instead of a misleading zero.
- The existing burgundy and warm-paper visual theme is retained. No banner file exists in the workspace, so the interface does not reference a missing image.

## Verification

- Node tests cover legacy migration, duplicate names/IDs, cent calculations, pending fundraising, invalid data, storage failures/conflicts, corrupt JSON, file size limits, escaped reports, and static asset isolation.
- Browser checks cover creating records, correcting fundraiser reports, persistence after reload, duplicate names, expense deletion and confirmation cancellation, actual JSON download/import, invalid imports, quota errors, printing, mobile overflow, recovery, and stale-tab blocking.
- The local server applies the same response headers specified for Vercel. Actual Vercel deployment remains a separate step; hosting behavior is not claimed verified until deployed.

## Remaining prototype constraints

Data belongs to a browser and origin, with no sign-in, synchronization, or cloud backup. Export regularly. Local storage is not a transactional multi-user database: two nearly simultaneous saves from different tabs may still race, so use one editing tab. A corrupted-data recovery file preserves bytes but does not automatically repair them. The original Python app retains its audit findings and is not the maintained deployment target.
