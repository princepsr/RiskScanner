# Contributing to BuildAegis

Thanks for taking the time to contribute.

## Development setup

- Java: 21
- Build: Maven Wrapper

### Build

```powershell
.\mvnw clean compile
```

### Run

```powershell
.\mvnw spring-boot:run
```

Open:
- `http://localhost:8080/`

### Test

```powershell
.\mvnw clean test
```

## What to contribute

- Bug fixes (dependency resolution, vulnerability enrichment, UI)
- New vulnerability providers (best-effort enrichers)
- Documentation fixes/updates

## Pull request guidelines

- Keep changes focused and small.
- Include a clear description of the problem and the solution.
- Add/update tests when reasonable.
- Avoid renaming packages / identifiers unless the change requires it.

## Reporting issues

Please include:
- OS
- Java version
- Build tool used (Maven/Gradle)
- Steps to reproduce
- Relevant logs (redact secrets)
