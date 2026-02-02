# Contributing

## Development Setup

- Use **Java 21**
- Use the Maven Wrapper

```powershell
.\mvnw clean test
```

## Running

Web mode:

```powershell
.\mvnw spring-boot:run
```

Desktop mode:

```powershell
.\mvnw -Pdesktop javafx:run
```

## Coding Guidelines

- Prefer constructor injection (avoid field injection) for new code.
- Keep DTOs immutable (records are preferred).
- Do not commit secrets (API keys, tokens).
- When adding new enrichment providers:
  - Keep network calls best-effort and time-bounded
  - Make sure failures do not block the core scan/analyze flow

## Testing Notes

- Tests are currently smoke tests that validate Spring context startup.
- When adding new beans/configuration, keep the context load fast.
