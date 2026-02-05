# Frontend Modules (app.js)

This document describes the logical modules inside `src/main/resources/static/app.js`.

## DOM Module

**Responsibility:** safe, consistent DOM access.

Typical patterns:
- Never assume an element exists; fail gracefully.
- Prefer `textContent` for text updates.

## API Helper

**Responsibility:** standardize network requests.

Behavior:
- Adds headers (JSON)
- Parses JSON responses
- Converts errors into friendly UI messages
- Validates response shape defensively

## State

**Responsibility:** store application data and view configuration.

Key responsibilities:
- Maintain `allFindings` and `filteredFindings`
- Persist filter values
- Apply filters consistently
- Drive rendering

Important rule:
- Filters always apply to `allFindings` and derive `filteredFindings`.

## UI

**Responsibility:** update the DOM based on state.

Sub-areas:
- **Overview**: KPI cards + metadata
- **Findings**: filter row + table
- **Analysis**: distribution bars + recommendations
- **Modal**: details for a selected finding
- **Overlay**: loading indicator
- **Errors**: error banner

## Scanner

**Responsibility:** orchestrate user-triggered scans and cache loads.

Main operations:
- `analyzeProject()` → POST `/api/project/analyze`
- `loadCached()` → GET `/api/dashboard/cached-results`

Scanner responsibilities:
- Set loading states (`State.isScanning`)
- Handle API errors
- Map backend DTOs into frontend findings
- Push results into state (`State.setFindings`)

## Mapping Layer

**Responsibility:** convert backend DTOs into frontend finding objects.

Key tasks:
- Build `dependency` display string
- Extract vulnerability IDs and counts from `enrichment`
- Compute severity (based on vulnerability count thresholds)
- Compute/display per-finding risk score

## Event Bindings

`app.js` wires events for:
- Analyze button
- Load cached button
- Clear button
- AI enable toggle
- Filter dropdowns
- Search input
- Export CSV button
- Modal open/close

---

If you split `app.js` into real ES modules in the future, use these module boundaries as the initial cut lines.
