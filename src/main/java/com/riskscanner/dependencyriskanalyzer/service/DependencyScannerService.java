package com.riskscanner.dependencyriskanalyzer.service;

import com.riskscanner.dependencyriskanalyzer.model.DependencyCoordinate;
import com.riskscanner.dependencyriskanalyzer.model.DependencyNode;
import com.riskscanner.dependencyriskanalyzer.service.dependency.DependencyResolverFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Scans a local filesystem path for dependency declarations using proper dependency resolution.
 *
 * <p>Supported inputs:
 * <ul>
 *   <li>A project folder that contains a recognized build file</li>
 *   <li>A direct path to a build file</li>
 * </ul>
 *
 * <p>Supported build tools:
 * <ul>
 *   <li>Maven: {@code pom.xml} with full transitive dependency resolution</li>
 *   <li>Gradle: {@code build.gradle} / {@code build.gradle.kts} with dependency tree</li>
 * </ul>
 */
@Service
public class DependencyScannerService {

    private final DependencyResolverFactory resolverFactory;

    @Autowired
    public DependencyScannerService(DependencyResolverFactory resolverFactory) {
        this.resolverFactory = resolverFactory;
    }

    /**
     * Legacy scan method that returns string coordinates in the form {@code groupId:artifactId:version}.
     * Prefer {@link #scanProject(String)} for richer output.
     */
    public List<String> scanDependencies(String filePath) throws Exception {
        List<DependencyCoordinate> coordinates = scanProject(filePath);
        return coordinates.stream()
            .map(coord -> coord.groupId() + ":" + coord.artifactId() + ":" + coord.version())
            .collect(Collectors.toList());
    }

    /**
     * Scans a project folder (or build file) and returns structured dependency coordinates.
     *
     * <p>Uses proper dependency resolution to include transitive dependencies and their scopes.
     * The method automatically detects the build tool type and uses the appropriate resolver.
     *
     * @param projectPath path to project folder or build file
     * @return list of dependency coordinates (direct and transitive)
     * @throws Exception if no supported build file is found or resolution fails
     */
    public List<DependencyCoordinate> scanProject(String projectPath) throws Exception {
        Path inputPath = Paths.get(projectPath);
        
        if (!resolverFactory.supports(inputPath)) {
            throw new Exception("No supported build file found in: " + projectPath + 
                ". Supported files: pom.xml, build.gradle, build.gradle.kts");
        }

        try {
            // Get the appropriate resolver
            var resolver = resolverFactory.getResolver(inputPath);
            
            // Resolve dependencies using the resolver
            List<DependencyNode> dependencyNodes = resolver.resolveDependencies(inputPath);
            
            // Flatten the tree to get all dependencies
            return flattenDependencyTree(dependencyNodes);
            
        } catch (Exception e) {
            throw new Exception("Failed to resolve dependencies for " + projectPath + ": " + e.getMessage(), e);
        }
    }

    /**
     * Scans a project and returns the full dependency tree structure.
     *
     * <p>This method preserves the hierarchical structure of dependencies,
     * including parent-child relationships and dependency paths.
     *
     * @param projectPath path to project folder or build file
     * @return list of root dependency nodes with their transitive dependencies
     * @throws Exception if no supported build file is found or resolution fails
     */
    public List<DependencyNode> scanProjectTree(String projectPath) throws Exception {
        Path inputPath = Paths.get(projectPath);
        
        if (!resolverFactory.supports(inputPath)) {
            throw new Exception("No supported build file found in: " + projectPath);
        }

        var resolver = resolverFactory.getResolver(inputPath);
        return resolver.resolveDependencies(inputPath);
    }

    /**
     * Flattens a dependency tree into a list of unique dependency coordinates.
     *
     * @param dependencyNodes list of root dependency nodes
     * @return flattened list of unique dependency coordinates
     */
    private List<DependencyCoordinate> flattenDependencyTree(List<DependencyNode> dependencyNodes) {
        List<DependencyCoordinate> result = new ArrayList<>();
        flattenNode(dependencyNodes, result);
        return result;
    }

    /**
     * Recursively flattens dependency nodes into a list of coordinates.
     *
     * @param nodes current list of nodes to process
     * @param result accumulator for unique coordinates
     */
    private void flattenNode(List<DependencyNode> nodes, List<DependencyCoordinate> result) {
        for (DependencyNode node : nodes) {
            boolean isDirect = node.isDirectDependency();
            
            DependencyCoordinate coord = new DependencyCoordinate(
                node.getCoordinate().groupId(),
                node.getCoordinate().artifactId(),
                node.getCoordinate().version(),
                node.getCoordinate().buildTool(),
                node.getCoordinate().scope(),
                isDirect
            );
            
            // Add if not already present (avoid duplicates)
            if (result.stream().noneMatch(c -> 
                c.groupId().equals(coord.groupId()) && 
                c.artifactId().equals(coord.artifactId()) && 
                c.version().equals(coord.version()))) {
                result.add(coord);
            } else {
            }
            
            // Recursively process children
            if (!node.getChildren().isEmpty()) {
                flattenNode(node.getChildren(), result);
            }
        }
    }
}
