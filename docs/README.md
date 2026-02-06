# BuildAegis Documentation

Welcome to the BuildAegis documentation. This organized documentation structure provides comprehensive information for users, developers, and system administrators.

## Documentation Structure

```
docs/
├── README.md                    # This file - Documentation overview
├── user-guide/                  # End-user documentation
│   ├── getting-started.md       # Quick start guide
│   ├── features.md              # Feature overview and usage
│   ├── ui-guide.md              # User interface explanation
│   └── troubleshooting.md       # Common issues and solutions
├── developer/                   # Developer documentation
│   ├── backend/
│   │   ├── architecture.md      # Backend system architecture
│   │   ├── components.md      # Backend components explained
│   │   └── api-reference.md   # API endpoints and usage
│   └── frontend/
│       ├── architecture.md    # Frontend architecture (accurate)
│       ├── modules.md         # JavaScript modules explained
│       └── components.md      # UI components explained
├── architecture/                # System architecture
│   ├── overview.md            # High-level system design
│   ├── data-flow.md           # Data flow diagrams
│   └── risk-scoring.md        # Risk scoring algorithm
└── api/                         # API documentation
    └── endpoints.md           # Complete API reference
```

## Quick Navigation

### For Users
- **[Getting Started](user-guide/getting-started.md)** - First time setup and basic usage
- **[Features Guide](user-guide/features.md)** - Understanding all features
- **[UI Guide](user-guide/ui-guide.md)** - Interface walkthrough

### For Developers
- **[Backend Architecture](developer/backend/architecture.md)** - Understanding the backend
- **[Frontend Architecture](developer/frontend/architecture.md)** - Understanding the frontend (accurate)
- **[API Reference](api/endpoints.md)** - Complete API documentation
- **[Risk Scoring Algorithm](architecture/risk-scoring.md)** - How risk scores are calculated

### Project Policies
- **[Contributing](CONTRIBUTING.md)** - How to contribute changes
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards
- **[Security Policy](SECURITY.md)** - Responsible disclosure

## Key Information

### Current Risk Scoring Algorithm
BuildAegis uses a **critical-dominance weighted algorithm** with the following characteristics:

- **Critical vulnerabilities** have disproportionate impact (40 points each + boost)
- **Minimum score floors** based on critical count: 1 Critical min 40, 2 Critical min 60, 3+ Critical min 90
- **Scale**: 0-100, where higher = more risk
- **Current view only**: Score represents filtered/current view, not total project

### Frontend Structure (Accurate)
The frontend is **NOT** component-based as previously documented. It's a simple, flat structure:

```
src/main/resources/static/
├── index.html          # Single-page application
├── app.js              # All JavaScript logic (~30KB)
├── styles.css          # All styles (~23KB)
└── css/                # Additional CSS files
    └── ...
```

**Key modules in app.js:**
- **DOM Utilities** - Element selection and manipulation
- **State Management** - Application state with filters
- **UI Module** - All rendering and UI updates
- **Scanner Module** - API calls and analysis orchestration

### Supported Features
- Maven and Gradle project analysis
- OSV vulnerability database integration
- AI-powered risk explanations (OpenAI, Claude, Gemini, Ollama, Azure)
- Local caching of analysis results
- Export to CSV
- Filterable findings table
- Severity-based risk categorization

## Important Notes

### Outdated Documentation
Previous documentation (especially `UI_DEVELOPMENT.md`) described a modular component architecture that **does not exist**. The actual implementation uses a simpler, monolithic approach that works well for this application scale.

### Security
- All analysis happens locally
- API keys are encrypted at rest (when encryption secret is configured)
- No code execution in safe mode (Maven)
- Controlled execution for Gradle

## Contributing to Documentation

When updating documentation:
1. Verify against actual code
2. Update relevant sections in the organized structure
3. Keep README.md in sync
4. Remove outdated files after migrating content

---

*Last updated: February 2026*
