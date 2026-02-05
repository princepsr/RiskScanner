# Risk Scoring Algorithm

This document defines how risk scores are computed and displayed in the current application.

## Scope

There are **two** risk scores shown in the UI:

1. **Overall risk score** (KPI card)
2. **Per-finding risk score** (shown in the details modal)

This document primarily describes the **Overall risk score** calculation, which is implemented on the **frontend**.

## Key Principle: Score Represents the Current View

The **Overall risk score represents the current view**.

That means:
- The score is computed from the **currently visible** findings after filters/search are applied.
- If you filter to only Critical findings, the score is computed using only those findings.
- This is intentional: it makes the KPI match the user’s current focus.

## Inputs

The algorithm takes a summary of the current view:

- `critical` = number of CRITICAL findings
- `high` = number of HIGH findings
- `medium` = number of MEDIUM findings
- `low` = number of LOW findings

These counts are derived from mapped findings (dependencies), not raw CVE entries.

## Severity Classification (Frontend)

The frontend classifies severity primarily from vulnerability count per dependency:

- **CRITICAL**: 10+ vulnerabilities
- **HIGH**: 5–9 vulnerabilities
- **MEDIUM**: 2–4 vulnerabilities
- **LOW**: 0–1 vulnerabilities

This classification is applied during mapping of backend DTOs into frontend findings.

## Overall Risk Score Algorithm

### 1) Weighted Base Score

Compute a base score using weighted counts:

- Critical: **40** points each
- High: **30** points each
- Medium: **15** points each
- Low: **5** points each

Pseudo:

```js
base = 40*critical + 30*high + 15*medium + 5*low
```

### 2) Critical Dominance Boost

Critical findings dominate the overall risk score.

The algorithm enforces guardrails (minimum floors) based on critical count:

- If `critical >= 3` → minimum score = **90**
- Else if `critical == 2` → minimum score = **60**
- Else if `critical == 1` → minimum score = **40**

Pseudo:

```js
if (critical >= 3) score = max(score, 90)
else if (critical === 2) score = max(score, 60)
else if (critical === 1) score = max(score, 40)
```

### 3) Normalization & Capping

- The final score is capped at **100**.
- The final score is floored at **0**.

Pseudo:

```js
score = Math.max(0, Math.min(100, score))
```

### 4) Empty Results

If there are no findings (total = 0), the score should be **0**.

## Why This Model

This model is designed to be:

- **Intuitive**: higher count/severity → higher score
- **Non-linear for criticals**: even a small number of criticals should be treated as urgent
- **Stable**: avoids tiny scores when criticals exist
- **Fast**: computed in constant time from summary counts

## Examples

### Example A: 0 findings
- critical=0, high=0, medium=0, low=0
- score = 0

### Example B: 1 critical only
- base = 40
- floor = 40
- score = 40

### Example C: 2 critical only
- base = 80
- floor = 60
- score = 80

### Example D: 2 critical + 2 high + 2 low
- base = 2*40 + 2*30 + 2*5 = 80 + 60 + 10 = 150
- cap at 100 → score = 100

### Example E: 0 critical, 3 high, 4 medium
- base = 3*30 + 4*15 = 90 + 60 = 150
- cap at 100 → score = 100

## Per-Finding Risk Score

A per-finding risk score is displayed in the modal.

Source:
- Usually comes from backend `DependencyRiskDto.riskScore` (AI-derived or computed),
- Or is derived/mapped during frontend transformation.

If the backend provides an explicit `riskScore`, the UI should display it as-is.

## Status Chip Logic

The status chip uses the same severity thresholds:

- If total == 0 → “No Issues”
- Else if critical > 0 → “Critical Issues”
- Else if high > 0 → “High Risk”
- Else if medium > 0 → “Medium Risk”
- Else → “Low Risk”

**Note:** status reflects the **current view** because it is computed from the filtered summary.

---

Related docs:
- `docs/developer/frontend/architecture.md`
- `docs/user-guide/features.md`
- `src/main/resources/static/app.js`
