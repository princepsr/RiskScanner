package com.riskscanner.dependencyriskanalyzer.repository;

import com.riskscanner.dependencyriskanalyzer.model.AiSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiSettingsRepository extends JpaRepository<AiSettingsEntity, Long> {
}
