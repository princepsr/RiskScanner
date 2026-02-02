package com.riskscanner.dependencyriskanalyzer.model;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * JPA entity for cached per-dependency AI analysis results.
 *
 * <p>Uniqueness:
 * <ul>
 *   <li>One record per dependency coordinate ({@code groupId:artifactId:version}) and AI configuration
 *   ({@code provider + model}).</li>
 * </ul>
 *
 * <p>Stored payload:
 * <ul>
 *   <li>Risk assessment (risk level/score/explanation/recommendations)</li>
 *   <li>Optional enrichment JSON used at analysis time</li>
 *   <li>Analysis timestamp</li>
 * </ul>
 */
@Entity
@Table(
        name = "dependency_risk_cache",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "artifact_id", "version", "provider", "model"})
)
public class DependencyRiskCacheEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private String groupId;

    @Column(name = "artifact_id", nullable = false)
    private String artifactId;

    @Column(nullable = false)
    private String version;

    @Column(name = "build_tool", nullable = false)
    private String buildTool;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel;

    @Column
    private Integer riskScore;

    @Lob
    @Column(nullable = false)
    private String explanation;

    @Lob
    @Column(nullable = false)
    private String recommendationsJson;

    @Lob
    @Column(name = "enrichment_json")
    private String enrichmentJson;

    @Column(nullable = false)
    private Instant analyzedAt;

    public Long getId() {
        return id;
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public void setArtifactId(String artifactId) {
        this.artifactId = artifactId;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getBuildTool() {
        return buildTool;
    }

    public void setBuildTool(String buildTool) {
        this.buildTool = buildTool;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getRecommendationsJson() {
        return recommendationsJson;
    }

    public void setRecommendationsJson(String recommendationsJson) {
        this.recommendationsJson = recommendationsJson;
    }

    public String getEnrichmentJson() {
        return enrichmentJson;
    }

    public void setEnrichmentJson(String enrichmentJson) {
        this.enrichmentJson = enrichmentJson;
    }

    public Instant getAnalyzedAt() {
        return analyzedAt;
    }

    public void setAnalyzedAt(Instant analyzedAt) {
        this.analyzedAt = analyzedAt;
    }
}
