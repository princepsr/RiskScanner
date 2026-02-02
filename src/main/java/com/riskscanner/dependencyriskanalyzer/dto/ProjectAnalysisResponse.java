package com.riskscanner.dependencyriskanalyzer.dto;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for a project analysis.
 *
 * @param projectPath analyzed project path
 * @param analyzedAt  time the analysis request started
 * @param results     per-dependency results
 */
public record ProjectAnalysisResponse(
        String projectPath,
        Instant analyzedAt,
        List<DependencyRiskDto> results
) {
}
