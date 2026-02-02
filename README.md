# Risk Scanner

Risk Scanner is a local-first Java (Spring Boot) application that scans a Java project (Maven or Gradle), enriches dependency metadata (OSV + Maven Central + optional GitHub), and produces an AI-assisted risk assessment per dependency. Results are cached locally in an H2 database. Reports can be exported as JSON or PDF. A JavaFX desktop wrapper is included via a Maven profile.

## Features

- **Dependency scanning**
  - Maven: `pom.xml`
  - Gradle: `build.gradle`, `build.gradle.kts`
- **AI risk analysis** (OpenAI via `com.theokanning.openai-gpt3-java`)
  - Per-dependency structured analysis (risk level/score + recommendations)
- **Metadata enrichment**
  - OSV vulnerabilities
  - Maven Central POM / SCM URL
  - Optional GitHub repository statistics (best-effort)
- **Local caching** (H2 + Spring Data JPA)
- **Export**
  - JSON export endpoint
  - PDF export endpoint (OpenPDF)
- **Desktop mode**
  - JavaFX wrapper that runs Spring Boot and loads the UI in a WebView

## Prerequisites

- **Java 21** (JDK)
- No global Maven required (uses the Maven Wrapper: `mvnw` / `mvnw.cmd`)

## Documentation

- Developer deep-dive (architecture, flow, code map, debugging): `docs/DEVELOPER_GUIDE.md`

## Quick Start (Web)

1. Run the backend:

```powershell
.\mvnw spring-boot:run
```

2. Open the UI:

- `http://localhost:8080/`

3. Configure AI:

- In the UI, set:
  - Provider: `openai`
  - Model: e.g. `gpt-4o-mini` (or any supported chat model)
  - API key: your OpenAI key

The API key is stored **encrypted** in the local database.

## Quick Start (Desktop)

Desktop mode is enabled via the Maven profile `desktop`.

```powershell
.\mvnw -Pdesktop javafx:run
```

Notes:
- This starts the same Spring Boot backend locally and loads the UI inside a JavaFX WebView.

## Testing

```powershell
.\mvnw clean test
```

## Building a JAR

```powershell
.\mvnw clean package
```

Run the built jar:

```powershell
java -jar target\dependency-risk-analyzer-0.0.1-SNAPSHOT.jar
```

## Configuration

Main configuration file:
- `src/main/resources/application.properties`

Key settings:
- **H2 database**: persisted to `./data/risk-scanner`
- **H2 console**: `http://localhost:8080/h2-console`
- **Encryption secret**: `riskscanner.encryption.secret`
  - Set this for stable encryption across restarts.
  - If you change it later, previously stored encrypted API keys cannot be decrypted.

## API Endpoints

AI settings:
- `GET /api/ai/settings` – get current AI provider/model configuration state
- `PUT /api/ai/settings` – save AI settings (provider/model/apiKey)
- `POST /api/ai/test-connection` – verifies the AI key/model can be called

Project scan/analyze:
- `GET /api/project/scan?projectPath=...` – returns detected dependencies
- `POST /api/project/analyze` – scans + enriches + analyzes + caches

Dashboard:
- `GET /api/dashboard/cached-results` – returns cached results for current provider/model

Export:
- `POST /api/export/json` – generates analysis and downloads JSON report
- `POST /api/export/pdf` – generates analysis and downloads PDF report

## Security Notes

- Do **not** commit API keys.
- Set `riskscanner.encryption.secret` locally (or via environment-specific configuration) before storing secrets.

## Project Structure

- `src/main/java/.../controller` – REST controllers
- `src/main/java/.../service` – scanning, enrichment, AI, caching orchestration
- `src/main/java/.../model` – JPA entities and domain types
- `src/main/java/.../dto` – request/response DTOs
- `src/main/resources/static` – local UI (`index.html`)
- `src/desktop/java` – JavaFX desktop wrapper (only compiled in `-Pdesktop`)

## Troubleshooting

- **Build fails with JavaFX classes**: ensure you are running desktop mode with `-Pdesktop`.
- **AI test-connection fails**:
  - Verify provider is `openai`
  - Verify model name is valid
  - Verify your API key is correct
- **Old cached results**:
  - Use `forceRefresh=true` in the UI / request to bypass cache.
