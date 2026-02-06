package com.riskscanner.dependencyriskanalyzer.model;

public record DependencyCoordinate(
        String groupId,
        String artifactId,
        String version,
        String buildTool,
        String scope,
        boolean isDirect
) {
    public DependencyCoordinate(String groupId, String artifactId, String version, String buildTool, String scope) {
        this(groupId, artifactId, version, buildTool, scope, true);
    }
}
