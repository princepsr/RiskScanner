package com.riskscanner.dependencyriskanalyzer.dto;

import com.riskscanner.dependencyriskanalyzer.model.RiskLevel;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO representing a per-dependency risk assessment.
 *
 * <p>Notes:
 * <ul>
 *   <li>{@code fromCache} indicates whether the record came from the local cache.</li>
 *   <li>{@code enrichment} contains optional metadata used during analysis (OSV, SCM, GitHub).</li>
 * </ul>
 */
public record DependencyRiskDto(
        String groupId,
        String artifactId,
        String version,
        String buildTool,
        DependencyEnrichmentDto enrichment,
        RiskLevel riskLevel,
        Integer riskScore,
        String explanation,
        List<String> recommendations,
        boolean fromCache,
        Instant analyzedAt,
        String provider,
        String model,
        boolean isDirect
) {
}
