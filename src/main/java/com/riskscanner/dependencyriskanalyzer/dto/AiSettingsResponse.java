package com.riskscanner.dependencyriskanalyzer.dto;

import java.time.Instant;

public record AiSettingsResponse(
        String provider,
        String model,
        boolean configured,
        Instant updatedAt
) {
}
