# Developer Guide

This document explains the internal architecture of Risk Scanner and how requests flow through the system. It is intended to help developers quickly locate code, set breakpoints, and debug issues.

## High-level Architecture

Risk Scanner is a Spring Boot application with:

- A static UI served from `src/main/resources/static/index.html`
- REST endpoints under `/api/*`
- Services for scanning, enrichment, AI analysis, caching, and export
- An H2 database for local persistence
- (Optional) a JavaFX desktop wrapper that loads the same UI in a WebView

### Primary flow (happy path)

1. UI sends a request to analyze a project.
2. The backend scans dependencies from the project.
3. Each dependency is optionally enriched using external metadata.
4. Each dependency is analyzed using the configured AI provider.
5. The result is cached locally.
6. The API returns a structured response used by the UI and export endpoints.

## Code Map (Where things are)

### Entry point

- `com.riskscanner.dependencyriskanalyzer.RiskScannerApplication`
  - Spring Boot main class.

### Controllers (REST API layer)

- `controller/AiSettingsController`
  - `/api/ai/settings` get/save settings
  - `/api/ai/test-connection` quick connectivity test
- `controller/ProjectAnalysisController`
  - `/api/project/scan` scans project build file(s)
  - `/api/project/analyze` full pipeline (scan + enrich + AI + cache)
- `controller/DashboardController`
  - `/api/dashboard/cached-results` reads cached results scoped to provider/model
- `controller/ExportController`
  - `/api/export/json` generates and downloads JSON report
  - `/api/export/pdf` generates and downloads PDF report

### Services (Business logic)

- `service/DependencyScannerService`
  - Reads a project folder or build file and extracts dependency coordinates.
  - Supports Maven and Gradle.
- `service/MetadataEnrichmentService`
  - Best-effort enrichment via OSV + Maven Central POM + GitHub.
- `service/AIAnalysisService`
  - Calls OpenAI chat completion API.
  - Preferred API: per-dependency analysis returning structured JSON fields.
- `service/ProjectAnalysisService`
  - Orchestrates the pipeline.
  - Handles cache checks and persistence.
- `service/AiSettingsService`
  - Persists provider/model/api key to the DB.
- `service/CryptoService`
  - Encrypts/decrypts API keys (AES-GCM) when `riskscanner.encryption.secret` is set.
- `service/PdfExportService`
  - Builds a compact PDF summary from `ProjectAnalysisResponse`.

### Persistence

- `model/AiSettingsEntity`
  - Single-row table for AI settings.
- `model/DependencyRiskCacheEntity`
  - Cache table for per-dependency risk results.
- Repositories:
  - `repository/AiSettingsRepository`
  - `repository/DependencyRiskCacheRepository`

### DTOs

- `dto/ProjectAnalysisRequest`, `dto/ProjectAnalysisResponse`
- `dto/DependencyRiskDto`
- `dto/DependencyEnrichmentDto`
- `dto/AiSettingsRequest`, `dto/AiSettingsResponse`

### Desktop wrapper

- `src/desktop/java/.../DesktopApplication`
  - JavaFX wrapper that starts Spring Boot and loads `http://localhost:8080/` in WebView.
  - Built only with Maven profile `-Pdesktop`.

## Detailed Request Flows

### 1) Configure AI settings

Endpoint:
- `PUT /api/ai/settings`

Flow:
1. `AiSettingsController.saveSettings(...)`
2. `AiSettingsService.saveSettings(...)`
3. `CryptoService.isEncryptionConfigured()` decides whether to encrypt
4. Settings saved to `AiSettingsEntity` (ID = 1)

Key data:
- `riskscanner.encryption.secret` controls whether API keys are encrypted.

### 2) Test AI connectivity

Endpoint:
- `POST /api/ai/test-connection`

Flow:
1. `AiSettingsController.testConnection()`
2. `AIAnalysisService.testConnection()`
3. Calls provider with a tiny request to validate auth and model.

Debug tips:
- Breakpoint in `AIAnalysisService.testConnection()` to inspect provider/model/key.

### 3) Scan a project

Endpoint:
- `GET /api/project/scan?projectPath=...`

Flow:
1. `ProjectAnalysisController.scan(...)`
2. `DependencyScannerService.scanProject(projectPath)`
3. Delegates to:
   - `scanMavenDependencies(...)` when `pom.xml`
   - Gradle scan when `build.gradle` / `build.gradle.kts`

Debug tips:
- Breakpoint in `scanProject(...)` to see which build file is selected.
- Breakpoint in `scanMavenDependencies(...)` to inspect extracted coordinates.

### 4) Analyze a project (main pipeline)

Endpoint:
- `POST /api/project/analyze`

Flow (per dependency):
1. `ProjectAnalysisController.analyze(...)`
2. `ProjectAnalysisService.analyze(request)`
3. Determine provider/model via `AiSettingsService`
4. Scan dependencies via `DependencyScannerService`
5. For each dependency:
   - Cache lookup in `DependencyRiskCacheRepository`
   - If cached and `forceRefresh=false`, return cached DTO
   - Else:
     - Enrich via `MetadataEnrichmentService.enrich(...)`
     - Analyze via `AIAnalysisService.analyzeDependencyRisk(...)`
     - Persist/overwrite cache entity
     - Return DTO

Important caching rule:
- Cache uniqueness is `groupId + artifactId + version + provider + model`.

Debug tips:
- Breakpoint in `ProjectAnalysisService.analyze(...)` inside the loop.
- Inspect:
  - `cached` entity
  - `forceRefresh`
  - `enrichment`
  - `analysis` result

### 5) Export report

Endpoints:
- `POST /api/export/json`
- `POST /api/export/pdf`

Flow:
1. `ExportController.exportJson/exportPdf`
2. Calls `ProjectAnalysisService.analyze(request)` (same pipeline)
3. Serializes response:
   - JSON: `ObjectMapper.writeValueAsBytes(response)`
   - PDF: `PdfExportService.generate(response)`

Debug tips:
- If exports are slow, check whether `forceRefresh` is triggering full re-analysis.

## Data Storage

### H2 database

- Default DB URL is configured in `application.properties`:
  - `jdbc:h2:file:./data/risk-scanner`
- H2 Console:
  - `http://localhost:8080/h2-console`

Tables:
- `ai_settings`
- `dependency_risk_cache`

## Common Debugging Scenarios

### "AI settings are not configured"

Where it comes from:
- `AiSettingsService.getApiKeyOrThrow()`

Fix:
- Save settings via UI or `PUT /api/ai/settings`.

### Encryption-related errors

Symptom:
- Decrypt fails with `Encryption secret is not configured`

Cause:
- API key was stored encrypted, but `riskscanner.encryption.secret` is now blank or changed.

Fix:
- Restore the original secret, or re-save settings (which overwrites the stored key).

### No dependencies detected

Common causes:
- `projectPath` points to a directory with no `pom.xml`/`build.gradle`/`build.gradle.kts`
- Build file uses complex Gradle syntax not matched by the current regex

Where to debug:
- `DependencyScannerService.scanProject(...)`
- `DependencyScannerService.scanGradleDependencies(...)`

### Enrichment issues (OSV/Maven Central/GitHub)

Notes:
- Enrichment is best-effort. Missing fields are expected when:
  - rate limits occur
  - SCM is not GitHub
  - network errors occur

Where to debug:
- `MetadataEnrichmentService.queryOsv(...)`
- `MetadataEnrichmentService.fetchScmFromMavenCentralPom(...)`
- `MetadataEnrichmentService.fetchGithubRepo(...)`

## Suggested Breakpoints

- `ProjectAnalysisService.analyze(...)`
  - start of method
  - inside dependency loop
  - cache hit branch
  - cache miss branch
- `AIAnalysisService.analyzeDependencyRisk(...)`
  - right before OpenAI request
  - immediately after response parsing
- `MetadataEnrichmentService.enrich(...)`
- `DependencyScannerService.scanProject(...)`

## Extending the Project

### Adding a new AI provider

Current behavior:
- Provider is validated in `AIAnalysisService` (`openai` only).

Suggested approach:
- Introduce a small interface (e.g., `AiClient`) with an OpenAI implementation.
- Switch `AIAnalysisService` to delegate to that interface.

### Adding new enrichment sources

- Add best-effort lookups to `MetadataEnrichmentService`.
- Keep failures non-fatal (return partial enrichment).

