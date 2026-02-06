package com.riskscanner.dependencyriskanalyzer.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.riskscanner.dependencyriskanalyzer.dto.DependencyEnrichmentDto;
import com.riskscanner.dependencyriskanalyzer.dto.DependencyRiskDto;
import com.riskscanner.dependencyriskanalyzer.repository.DependencyRiskCacheRepository;
import com.riskscanner.dependencyriskanalyzer.service.AiSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * Read-only endpoints for displaying cached results.
 *
 * <p>Cache lookups are scoped to the currently configured AI provider/model.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DependencyRiskCacheRepository cacheRepository;
    private final AiSettingsService aiSettingsService;
    private final ObjectMapper objectMapper;

    public DashboardController(
            DependencyRiskCacheRepository cacheRepository,
            AiSettingsService aiSettingsService,
            ObjectMapper objectMapper
    ) {
        this.cacheRepository = cacheRepository;
        this.aiSettingsService = aiSettingsService;
        this.objectMapper = objectMapper;
    }

    /**
     * Returns cached dependency risk results for the currently configured provider/model.
     */
    @GetMapping("/cached-results")
    public List<DependencyRiskDto> getCachedResults() throws Exception {
        String provider = aiSettingsService.getProvider();
        String model = aiSettingsService.getModel();

        List<DependencyRiskDto> results = new ArrayList<>();
        var entities = cacheRepository.findByProviderAndModel(provider, model);
        for (var entity : entities) {
            List<String> recommendations = objectMapper.readValue(
                    entity.getRecommendationsJson(),
                    new TypeReference<List<String>>() {}
            );

            DependencyEnrichmentDto enrichment = entity.getEnrichmentJson() == null
                    ? null
                    : objectMapper.readValue(entity.getEnrichmentJson(), DependencyEnrichmentDto.class);

            results.add(new DependencyRiskDto(
                    entity.getGroupId(),
                    entity.getArtifactId(),
                    entity.getVersion(),
                    entity.getBuildTool(),
                    enrichment,
                    entity.getRiskLevel(),
                    entity.getRiskScore(),
                    entity.getExplanation(),
                    recommendations,
                    true,
                    entity.getAnalyzedAt(),
                    entity.getProvider(),
                    entity.getModel(),
                    true
            ));
        }

        return results;
    }
}
