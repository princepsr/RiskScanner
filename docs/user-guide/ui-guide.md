# User Interface Guide

## Overview

Risk Scanner features a clean, two-panel interface designed for efficient vulnerability analysis. This guide walks through each UI element and explains its purpose.

## Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Risk Scanner                                    [Status: Idle]          │ Header
├─────────────────────────────┬───────────────────────────────────────────┤
│                             │                                           │
│  INPUT & CONFIGURATION      │  RESULTS & ANALYSIS                       │
│  (Left Panel)               │  (Right Panel)                            │
│                             │                                           │
│  ┌───────────────────────┐  │  ┌───────────────────────────────────────┐  │
│  │ Build Tool            │  │  │ Results Overview                      │  │
│  │ • Maven (selected)    │  │  │ • KPI Cards                           │  │
│  │ • Gradle              │  │  │ • Metadata                            │  │
│  └───────────────────────┘  │  └───────────────────────────────────────┘  │
│                             │                                           │
│  ┌───────────────────────┐  │  ┌───────────────────────────────────────┐  │
│  │ Project Path          │  │  │ Findings                              │  │
│  │ [Text input area]     │  │  │ • Filters                             │  │
│  │                       │  │  │ • Table                               │  │
│  └───────────────────────┘  │  └───────────────────────────────────────┘  │
│                             │                                           │
│  [Analyze] [Load Cached]    │  ┌───────────────────────────────────────┐  │
│  [Clear]                    │  │ Analysis                              │  │
│                             │  │ • Severity Bars                       │  │
│  ┌───────────────────────┐  │  │ • Recommendations                     │  │
│  │ AI Configuration      │  │  └───────────────────────────────────────┘  │
│  │ (Optional, collapsed) │  │                                           │
│  └───────────────────────┘  │                                           │
│                             │                                           │
└─────────────────────────────┴───────────────────────────────────────────┘
```

## Header

### App Title and Subtitle
- **Risk Scanner** - Main title
- **Dependency Vulnerability Analysis for Java Projects** - Subtitle explaining purpose

### Status Chip
Shows current application state:

| Status | Color | Meaning |
|--------|-------|---------|
| **Idle** | Gray | Ready to analyze |
| **Analyzing** | Blue | Scan in progress |
| **No Issues** | Green | Analysis complete, no vulnerabilities |
| **Low Risk** | Light green | Minor issues found |
| **Medium Risk** | Yellow | Moderate issues |
| **High Risk** | Orange | Serious issues found |
| **Critical Issues** | Red | Critical vulnerabilities detected |

## Left Panel: Input & Configuration

### 1. Build Tool Section

#### Tool Selection
Two radio buttons:
- **Maven** (default): High confidence analysis
- **Gradle**: Medium confidence (best-effort)

#### Info Button
Click the "i" button next to "Build tool" for:
- Gradle limitation warnings
- Confidence level explanation

### 2. Project Path Input

#### Text Area
- Enter full path to project directory
- Examples:
  - Windows: `C:\Users\Name\Projects\my-app`
  - macOS/Linux: `/home/user/projects/my-app`
- Automatically detects `pom.xml` or `build.gradle`

#### Character Count
- Shows `X characters` as you type
- Helps verify path was entered

#### Action Buttons
| Button | Icon | Purpose |
|--------|------|---------|
| **Analyze Dependencies** | 🔍 | Start full analysis |
| **Load Cached** | 📂 | Load previous results from database |
| **Clear** | 🗑️ | Clear project path input |

### 3. Transparency & Security Sections

Collapsible sections explaining:
- **How This Scan Works**: Maven vs Gradle analysis
- **Vulnerability Sources**: OSV, NVD, GitHub databases
- **Known Limitations**: Gradle false positives, multi-module issues
- **Data Privacy**: Local processing, no code sharing

### 4. AI Configuration (Optional)

#### Enable Toggle
- Checkbox to enable/disable AI analysis
- When checked, expands configuration fieldset

#### Configuration Fields (when enabled)
| Field | Description |
|-------|-------------|
| **Provider** | Select: OpenAI, Claude, Gemini, Ollama, Azure |
| **API Key** | Your provider API key (encrypted at rest) |

#### Security Note
- AI is optional - core detection works without it
- Only dependency names and CVE data sent to AI
- No source code shared

## Right Panel: Results & Analysis

### 1. Results Overview Card

#### Empty State (before analysis)
```
No scan yet
Enter a project path and run Analyze Dependencies to generate results.
```

#### KPI Cards (after analysis)
Seven metric cards showing:

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total deps      │ Vulns found     │ Critical        │
│     42          │       6         │       2         │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ High            │ Medium          │ Low             │ Overall Risk  │
│       2         │       1         │       1         │      60       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Card Details:**

| Card | Tooltip | Calculation |
|------|---------|-------------|
| Total dependencies | All deps resolved (direct + transitive) | Count of all dependencies |
| Vulnerabilities found | Deps with known CVEs | Count of vulnerable deps |
| Critical | 10+ CVEs or critical severity | Based on CVE count |
| High | 5-9 high severity CVEs | Based on CVE count |
| Medium | 2-4 medium severity CVEs | Based on CVE count |
| Low | 0-1 low severity CVEs | Based on CVE count |
| Overall risk score | 0-100, higher = more risk | Critical-dominance algorithm |

#### Confidence Badge
Located in the top-right of the card:
- **HIGH** (green): Maven project
- **MEDIUM** (yellow): Gradle project

Hover for tooltip: "Confidence reflects how reliably we can parse and resolve dependencies"

#### Metadata Section
After analysis, shows:
- **Build tool**: maven or gradle
- **Timestamp**: Analysis completion time
- **Vulnerability sources**: OSV, Maven Central, etc.

### 2. Findings Card

#### Gradle Warning (Gradle projects only)
Yellow alert banner:
> Note: Some vulnerabilities may be false positives due to Gradle resolution limitations. Review all findings carefully.

#### Confidence Legend
Three badges explaining confidence levels:
- **HIGH** (green): Direct match in dependency tree
- **MEDIUM** (yellow): Potential match, review recommended
- **LOW** (red): Possible false positive

#### Filters Section

```
┌────────────────────────────────────────────────────────────────────────┐
│ Search [____________]  Severity [All ▼]  Directness [All ▼]  Confidence│
│                                                                    │
│ [📥 Export CSV]                                    X findings          │
└────────────────────────────────────────────────────────────────────────┘
```

**Filter Controls:**

1. **Search Input**
   - Placeholder: "Filter by dependency name..."
   - Real-time filtering
   - Partial matches supported

2. **Severity Dropdown**
   - Options: All, Critical, High, Medium, Low
   - Filters findings by severity level

3. **Directness Dropdown**
   - All: Show everything
   - Direct: Only declared dependencies
   - Transitive: Only pulled-in dependencies

4. **Confidence Dropdown**
   - All: All confidence levels
   - HIGH: Maven projects
   - MEDIUM: Gradle projects

5. **Export CSV Button**
   - Downloads findings as CSV file
   - Includes all visible columns

6. **Findings Count**
   - Shows "X of Y findings" (filtered vs total)

#### Findings Table

```
┌──────────────┬──────┬──────────┬─────────────┬────────────┬───────────┬────────┐
│ Dependency   │ CVEs │ Severity │ ID          │ Confidence │ Directness│ Source │
├──────────────┼──────┼──────────┼─────────────┼────────────┼───────────┼────────┤
│ log4j:core   │  12  │ CRITICAL │ CVE-2021... │   HIGH     │ Transitive│ OSV    │
│ spring:web   │   5  │ HIGH     │ CVE-2022... │   HIGH     │ Direct    │ OSV    │
│ ...          │ ...  │ ...      │ ...         │   ...      │ ...       │ ...    │
└──────────────┴──────┴──────────┴─────────────┴────────────┴───────────┴────────┘
```

**Column Descriptions:**

| Column | Example | Tooltip |
|--------|---------|---------|
| Dependency | `org.apache.logging.log4j:log4j-core:2.14.1` | groupId:artifactId:version |
| CVEs | `12` | Number of known CVEs |
| Severity | `CRITICAL` badge | Based on CVE count thresholds |
| ID | `CVE-2021-44228` | Primary vulnerability identifier |
| Confidence | `HIGH` badge | Match reliability |
| Directness | `Transitive` chip | How dependency was included |
| Source | `OSV` | Data source |

**Row Actions:**
- **View button**: Opens detail modal

#### Empty Table State
```
Run an analysis to populate findings.
```

### 3. Analysis Card

#### Severity Distribution

Visual bar chart showing distribution:

```
Critical ████████████████████░░░░░░░░░░ 2 (33%)
High     ████████████████████░░░░░░░░░░ 2 (33%)
Medium   ██████████░░░░░░░░░░░░░░░░░░░░ 1 (17%)
Low      ██████████░░░░░░░░░░░░░░░░░░░░ 1 (17%)
```

Each bar shows:
- Label (Critical/High/Medium/Low)
- Visual fill proportional to count
- Raw count and percentage

Updates based on current filter selection.

#### Top Recommendations

Bulleted list of actionable advice:

```
• Upgrade org.apache.logging.log4j:log4j-core from 2.14.1 to 2.17.0 or later to address 12 vulnerabilities including Log4Shell (CVE-2021-44228)
• Review org.springframework:spring-web usage and upgrade to 5.3.18 or later
• Consider using a Web Application Firewall (WAF) as temporary mitigation
```

Sources recommendations from AI analysis (if enabled) or uses default templates.

## Detail Modal

Opened by clicking "View" on any finding row.

### Header
```
┌────────────────────────────────────────────────────────────────────┐
│ Finding details                                    [Close]         │
│ org.apache.logging.log4j:log4j-core:2.14.1                        │
├────────────────────────────────────────────────────────────────────┤
│ [CRITICAL] [CVE-2021-44228] [Risk Score: 75] [HIGH] [Transitive]  │
│ [Source: OSV]                                                      │
└────────────────────────────────────────────────────────────────────┘
```

**Chips:**
- Severity badge (color-coded: red=Critical, orange=High, yellow=Medium, green=Low)
- Vulnerability ID
- Risk score for this specific finding
- Confidence level
- Directness
- Data source

### Content Sections

#### Description
Full vulnerability description explaining:
- What the vulnerability is
- How it can be exploited
- Why it matters

Example:
```
Log4Shell (CVE-2021-44228) is a critical remote code execution vulnerability 
in Apache Log4j 2. An attacker who can control log messages or log message 
parameters can execute arbitrary code loaded from LDAP servers when message 
lookup substitution is enabled.
```

#### Affected Versions
Code block showing vulnerable version ranges:
```
2.0-beta9 through 2.14.1
```

#### Dependency Path
Shows how the dependency was included:
```
your-app
└── spring-boot-starter-web
    └── spring-boot-starter
        └── spring-boot-starter-logging
            └── log4j-to-slf4j (transitive)
            └── log4j-core (vulnerable)
```

#### Risk Explanation (AI-enabled)
AI-generated contextual analysis:
```
Risk Explanation [AI-Assisted]

This vulnerability is CRITICAL because:
• Remote code execution is possible
• Attack vector is easily accessible (logging)
• Widespread exploitation in the wild
• Your specific usage through spring-boot-starter-logging means it may be active

Recommendation:
Upgrade to log4j 2.17.0+ immediately. This is a breaking change that requires 
version alignment across all Log4j components.
```

## Loading Overlay

Appears during analysis:

```
┌─────────────────┐
│                 │
│    ⟳           │  Spinner animation
│                 │
│  Working...     │  Status text
│                 │
└─────────────────┘
```

Prevents interaction while scan is in progress.

## Error Banner

Appears at top of results panel for errors:

```
┌────────────────────────────────────────────────────────────────────┐
│ ⚠ Analysis failed: Project path not found: /invalid/path            │
│                                                       [Dismiss]    │
└────────────────────────────────────────────────────────────────────┘
```

Auto-dismisses after 5 seconds or click X to close.

## Footer

```
v1.0.0 | Results are advisory, not a substitute for manual security review
```

- Version number
- Disclaimer about advisory nature of results

## Accessibility Features

- **Semantic HTML**: Proper headings, sections, labels
- **ARIA attributes**: Roles, labels, live regions for status updates
- **Keyboard navigation**: All interactive elements focusable
- **Color contrast**: Meets WCAG standards
- **Screen reader support**: Descriptive labels throughout

## Responsive Design

The interface is optimized for:
- **Desktop**: Full two-panel layout (recommended)
- **Tablet**: Condensed layout with collapsible sections
- **Minimum width**: 1024px recommended

## Tooltips

Hover over elements with `[?]` indicators for helpful information:

- **KPI Cards**: Explain what each metric means
- **Table Headers**: Describe column purpose
- **Confidence Badge**: Explain confidence calculation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Start analysis |
| `Escape` | Close modal / clear search |
| `Tab` | Navigate between elements |
| `Enter/Space` | Activate buttons |

---

*For feature details, see [Features Guide](features.md). For setup help, see [Getting Started](getting-started.md).*
