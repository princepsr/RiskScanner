# Architecture Overview

## System Overview

Risk Scanner is a Spring Boot application that:

- Scans Java projects (Maven/Gradle) for dependencies
- Enriches dependencies with vulnerability metadata
- Optionally uses AI for explanations and prioritization
- Caches results locally (H2)
- Presents results in a lightweight web UI (static files)

## Major Subsystems

### Backend (Spring Boot)

Responsibilities:
- Accept requests from UI
- Perform dependency scanning and enrichment
- Run AI analysis (optional)
- Cache and return results

### Frontend (Static SPA)

Responsibilities:
- Collect inputs (project path, AI settings)
- Call backend APIs
- Render results + filters + analysis
- Provide export and cached load actions

### Storage

- H2 database for AI settings and cached results
- Optional local file caches for vulnerability data

## Runtime Data Flow

1. User inputs project path
2. UI calls `POST /api/project/analyze`
3. Backend scans dependencies
4. Backend enriches vulnerabilities
5. Backend optionally calls AI provider
6. Backend caches results
7. UI maps results to “findings” and renders

## Key Design Decisions

- Vanilla frontend to avoid supply-chain risk and reduce build complexity
- Local-first design with caching
- AI optional and treated as an enhancement layer
- Gradle analysis marked as medium-confidence due to dynamic resolution

---

Related docs:
- `docs/developer/backend/architecture.md`
- `docs/developer/frontend/architecture.md`
- `docs/architecture/risk-scoring.md`
