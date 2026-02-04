package com.riskscanner.dependencyriskanalyzer.model;

/**
 * Confidence level for dependency resolution results.
 *
 * <p>Indicates how reliable the dependency information is based on the
 * resolution method used:
 * <ul>
 *   <li>HIGH - Direct API-based resolution (Maven Aether)</li>
 *   <li>MEDIUM - CLI output parsing (Gradle dependencies)</li>
 *   <li>LOW - Fallback or heuristic methods</li>
 * </ul>
 */
public enum ResolutionConfidence {
    /**
     * High confidence - resolved via direct API (Maven Aether).
     * Includes accurate transitive dependencies and scopes.
     */
    HIGH("Direct API-based resolution"),
    
    /**
     * Medium confidence - resolved via CLI output parsing.
     * May miss some transitive dependencies or have incomplete scope information.
     */
    MEDIUM("CLI output parsing"),
    
    /**
     * Low confidence - resolved via fallback or heuristic methods.
     * Should be used with caution and clearly marked as best-effort.
     */
    LOW("Fallback/heuristic methods");
    
    private final String description;
    
    ResolutionConfidence(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
