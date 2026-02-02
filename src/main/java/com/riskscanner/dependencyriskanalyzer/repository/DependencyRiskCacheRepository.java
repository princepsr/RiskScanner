package com.riskscanner.dependencyriskanalyzer.repository;

import com.riskscanner.dependencyriskanalyzer.model.DependencyRiskCacheEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DependencyRiskCacheRepository extends JpaRepository<DependencyRiskCacheEntity, Long> {

    List<DependencyRiskCacheEntity> findByProviderAndModel(String provider, String model);

    Optional<DependencyRiskCacheEntity> findByGroupIdAndArtifactIdAndVersionAndProviderAndModel(
            String groupId,
            String artifactId,
            String version,
            String provider,
            String model
    );
}
