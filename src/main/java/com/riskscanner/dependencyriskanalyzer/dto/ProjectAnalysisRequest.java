package com.riskscanner.dependencyriskanalyzer.dto;

/**
 * Request DTO for running a project analysis.
 *
 * @param projectPath  directory containing a supported build file (or direct build file path)
 * @param forceRefresh when true, bypasses cached results and re-runs enrichment + AI analysis
 */
public record ProjectAnalysisRequest(
        String projectPath,
        boolean forceRefresh
) {
}
