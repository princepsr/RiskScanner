# Security Policy

## Reporting a Vulnerability

If you discover a security issue in this project, please report it privately.

## Sensitive Data

- Do **not** commit API keys.
- The application stores AI API keys encrypted in the local H2 database.
- Set `riskscanner.encryption.secret` in your local configuration to ensure stable encryption.
