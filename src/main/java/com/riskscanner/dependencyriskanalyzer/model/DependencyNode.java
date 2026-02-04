package com.riskscanner.dependencyriskanalyzer.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a dependency node in a resolved dependency graph.
 *
 * <p>Each node contains:
 * <ul>
 *   <li>The dependency coordinate (groupId:artifactId:version)</li>
 *   <li>Dependency scope (compile, test, runtime, etc.)</li>
 *   <li>Path from root dependency</li>
 *   <li>List of child dependencies (transitive)</li>
 *   <li>Resolution confidence level</li>
 * </ul>
 */
public class DependencyNode {

    private final DependencyCoordinate coordinate;
    private final String scope;
    private final List<String> pathFromRoot;
    private final List<DependencyNode> children;
    private final boolean directDependency;
    private final ResolutionConfidence confidence;

    public DependencyNode(
            DependencyCoordinate coordinate,
            String scope,
            List<String> pathFromRoot,
            boolean directDependency,
            ResolutionConfidence confidence
    ) {
        this.coordinate = coordinate;
        this.scope = scope;
        this.pathFromRoot = new ArrayList<>(pathFromRoot);
        this.children = new ArrayList<>();
        this.directDependency = directDependency;
        this.confidence = confidence;
    }

    // Backward compatibility constructor
    public DependencyNode(
            DependencyCoordinate coordinate,
            String scope,
            List<String> pathFromRoot,
            boolean directDependency
    ) {
        this(coordinate, scope, pathFromRoot, directDependency, ResolutionConfidence.MEDIUM);
    }

    public DependencyCoordinate getCoordinate() {
        return coordinate;
    }

    public String getScope() {
        return scope;
    }

    public List<String> getPathFromRoot() {
        return new ArrayList<>(pathFromRoot);
    }

    public List<DependencyNode> getChildren() {
        return new ArrayList<>(children);
    }

    public boolean isDirectDependency() {
        return directDependency;
    }

    public ResolutionConfidence getConfidence() {
        return confidence;
    }

    /**
     * Adds a child dependency to this node.
     *
     * @param child the child dependency node
     */
    public void addChild(DependencyNode child) {
        children.add(child);
    }

    /**
     * Gets the full dependency path as a string.
     *
     * @return path string like "root -> child -> grandchild"
     */
    public String getFullPath() {
        if (pathFromRoot.isEmpty()) {
            return coordinate.toString();
        }
        return String.join(" -> ", pathFromRoot) + " -> " + coordinate.toString();
    }

    @Override
    public String toString() {
        return String.format("DependencyNode{coordinate=%s, scope='%s', direct=%s, confidence=%s, children=%d}",
                coordinate, scope, directDependency, confidence, children.size());
    }
}
