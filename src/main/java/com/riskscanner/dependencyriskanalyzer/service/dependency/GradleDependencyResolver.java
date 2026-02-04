package com.riskscanner.dependencyriskanalyzer.service.dependency;

import com.riskscanner.dependencyriskanalyzer.model.DependencyCoordinate;
import com.riskscanner.dependencyriskanalyzer.model.DependencyNode;
import com.riskscanner.dependencyriskanalyzer.model.ResolutionConfidence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Gradle dependency resolver using Gradle command-line tool.
 *
 * <p>This resolver:
 * <ul>
 *   <li>Detects Gradle projects (build.gradle, build.gradle.kts)</li>
 *   <li>Uses Gradle dependencyInsight task to resolve dependencies</li>
 *   <li>Parses output to build dependency trees</li>
 *   <li>Handles both Groovy and Kotlin DSL</li>
 * </ul>
 */
@Component
public class GradleDependencyResolver implements DependencyResolver {

    private static final Logger logger = LoggerFactory.getLogger(GradleDependencyResolver.class);

    private static final Pattern DEPENDENCY_PATTERN = Pattern.compile(
        "^\\s*[+\\\\-]*[-+\\\\| ]*([^: \t]+):([^: \t]+):([^: \t]+).*$"
    );

    private static final List<String> CONFIGURATIONS = List.of(
        "compileClasspath",
        "runtimeClasspath", 
        "testRuntimeClasspath"
    );

    @Override
    public List<DependencyNode> resolveDependencies(Path projectPath) {
        logger.warn("Using Gradle CLI-based dependency resolution - this is heuristic-based with MEDIUM confidence");
        
        try {
            // Find Gradle build file
            Path buildFile = findGradleBuildFile(projectPath);
            if (buildFile == null) {
                throw new IllegalArgumentException("No Gradle build file found in " + projectPath);
            }

            // Resolve dependencies for multiple configurations and merge results
            List<DependencyNode> allNodes = new ArrayList<>();
            
            for (String configuration : CONFIGURATIONS) {
                try {
                    logger.debug("Resolving dependencies for configuration: {}", configuration);
                    List<String> dependencyLines = runGradleDependencyTree(projectPath, configuration);
                    List<DependencyNode> configNodes = parseDependencyTree(dependencyLines, configuration);
                    
                    // Merge with existing nodes, preserving scope information
                    mergeDependencyNodes(allNodes, configNodes, configuration);
                    
                } catch (Exception e) {
                    logger.warn("Failed to resolve dependencies for configuration {}: {}", configuration, e.getMessage());
                    // Continue with other configurations
                }
            }
            
            if (allNodes.isEmpty()) {
                throw new RuntimeException("Failed to resolve dependencies for any configuration");
            }
            
            logger.info("Gradle dependency resolution completed: {} root dependencies found", allNodes.size());
            return allNodes;

        } catch (Exception e) {
            throw new RuntimeException("Failed to resolve Gradle dependencies", e);
        }
    }

    @Override
    public boolean supports(Path projectPath) {
        return findGradleBuildFile(projectPath) != null;
    }

    @Override
    public BuildTool getBuildTool() {
        return BuildTool.GRADLE;
    }

    private Path findGradleBuildFile(Path projectPath) {
        // Check for Groovy DSL
        Path gradleFile = projectPath.resolve("build.gradle");
        if (Files.exists(gradleFile)) {
            return gradleFile;
        }
        
        // Check for Kotlin DSL
        Path gradleKtsFile = projectPath.resolve("build.gradle.kts");
        if (Files.exists(gradleKtsFile)) {
            return gradleKtsFile;
        }
        
        // If the path itself is a build file
        String fileName = projectPath.getFileName().toString();
        if (fileName.equals("build.gradle") || fileName.equals("build.gradle.kts")) {
            return projectPath;
        }
        
        return null;
    }

    private List<String> runGradleDependencyTree(Path projectPath, String configuration) throws IOException, InterruptedException {
        // Try to use Gradle wrapper first
        File gradleWrapper = projectPath.resolve("gradlew").toFile();
        if (!gradleWrapper.exists()) {
            gradleWrapper = projectPath.resolve("gradlew.bat").toFile();
        }
        
        String gradleCommand;
        if (gradleWrapper.exists()) {
            gradleCommand = gradleWrapper.getAbsolutePath();
        } else {
            // Fallback to system gradle
            gradleCommand = "gradle";
        }
        
        // Run gradle dependencies command
        ProcessBuilder pb = new ProcessBuilder(
            gradleCommand,
            "dependencies",
            "--configuration",
            configuration
        );
        pb.directory(projectPath.toFile());
        pb.redirectErrorStream(true);
        
        Process process = pb.start();
        List<String> output = new ArrayList<>();
        
        try (var reader = new java.io.BufferedReader(
            new java.io.InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.add(line);
            }
        }
        
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Gradle command failed with exit code: " + exitCode);
        }
        
        return output;
    }

    private List<DependencyNode> parseDependencyTree(List<String> dependencyLines, String configuration) {
        List<DependencyNode> result = new ArrayList<>();
        List<DependencyNode> nodeStack = new ArrayList<>();
        List<String> pathStack = new ArrayList<>();
        
        for (String line : dependencyLines) {
            // Skip empty lines and headers
            if (line.trim().isEmpty() || line.contains(configuration) || 
                line.contains("---") || line.contains("\\---")) {
                continue;
            }
            
            // Calculate depth based on indentation
            int depth = calculateDepth(line);
            
            // Parse dependency
            Matcher matcher = DEPENDENCY_PATTERN.matcher(line);
            if (matcher.find()) {
                String groupId = matcher.group(1);
                String artifactId = matcher.group(2);
                String version = matcher.group(3);
                
                // Determine scope based on configuration
                String scope = mapConfigurationToScope(configuration);
                
                // Create dependency coordinate
                DependencyCoordinate coordinate = new DependencyCoordinate(groupId, artifactId, version, "gradle", scope);
                
                // Build path from root
                List<String> currentPath = new ArrayList<>();
                for (int i = 0; i < Math.min(depth, pathStack.size()); i++) {
                    currentPath.add(pathStack.get(i));
                }
                
                // Create node with MEDIUM confidence
                DependencyNode node = new DependencyNode(
                    coordinate, scope, currentPath, depth == 0, ResolutionConfidence.MEDIUM
                );
                
                // Add to parent if exists
                if (!nodeStack.isEmpty() && depth > 0) {
                    int parentIndex = Math.min(depth - 1, nodeStack.size() - 1);
                    DependencyNode parent = nodeStack.get(parentIndex);
                    parent.addChild(node);
                }
                
                // Update stacks
                if (depth < nodeStack.size()) {
                    nodeStack = nodeStack.subList(0, depth);
                    pathStack = pathStack.subList(0, depth);
                }
                nodeStack.add(node);
                
                if (depth < pathStack.size()) {
                    pathStack = pathStack.subList(0, depth);
                }
                pathStack.add(coordinate.toString());
                
                // Add root nodes to result
                if (depth == 0) {
                    result.add(node);
                }
            }
        }
        
        return result;
    }

    private int calculateDepth(String line) {
        int depth = 0;
        for (char c : line.toCharArray()) {
            if (c == ' ' || c == '|') {
                depth++;
            } else if (c == '+' || c == '\\') {
                break;
            } else {
                break;
            }
        }
        return depth / 2; // Approximate depth calculation
    }

    /**
     * Maps Gradle configuration names to Maven-style scopes.
     */
    private String mapConfigurationToScope(String configuration) {
        return switch (configuration) {
            case "compileClasspath" -> "compile";
            case "runtimeClasspath" -> "runtime";
            case "testRuntimeClasspath" -> "test";
            default -> "compile";
        };
    }

    /**
     * Merges dependency nodes from different configurations, preserving scope information.
     */
    private void mergeDependencyNodes(List<DependencyNode> existingNodes, List<DependencyNode> newNodes, String configuration) {
        for (DependencyNode newNode : newNodes) {
            // Check if this dependency already exists
            DependencyNode existingNode = findNodeByCoordinate(existingNodes, newNode.getCoordinate());
            
            if (existingNode == null) {
                // New dependency, add as-is
                existingNodes.add(newNode);
            } else {
                // Existing dependency, merge children and update scope if needed
                mergeNodeChildren(existingNode, newNode);
                
                // Prefer more specific scopes (test > runtime > compile)
                String existingScope = existingNode.getScope();
                String newScope = mapConfigurationToScope(configuration);
                if (shouldUpdateScope(existingScope, newScope)) {
                    // Note: Since scope is final, we'd need to create a new node
                    // For now, we'll log this and keep the original scope
                    logger.debug("Scope conflict for {}: existing={}, new={}", 
                        newNode.getCoordinate(), existingScope, newScope);
                }
            }
        }
    }

    /**
     * Finds a node by coordinate in the list of nodes (recursively searches children).
     */
    private DependencyNode findNodeByCoordinate(List<DependencyNode> nodes, DependencyCoordinate coordinate) {
        for (DependencyNode node : nodes) {
            if (coordinatesEqual(node.getCoordinate(), coordinate)) {
                return node;
            }
            
            // Search in children
            DependencyNode found = findNodeByCoordinate(node.getChildren(), coordinate);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    /**
     * Merges children from source node into target node.
     */
    private void mergeNodeChildren(DependencyNode target, DependencyNode source) {
        for (DependencyNode sourceChild : source.getChildren()) {
            DependencyNode existingChild = findNodeByCoordinate(target.getChildren(), sourceChild.getCoordinate());
            
            if (existingChild == null) {
                target.addChild(sourceChild);
            } else {
                mergeNodeChildren(existingChild, sourceChild);
            }
        }
    }

    /**
     * Checks if coordinates are equal (ignoring build tool).
     */
    private boolean coordinatesEqual(DependencyCoordinate c1, DependencyCoordinate c2) {
        return c1.groupId().equals(c2.groupId()) &&
               c1.artifactId().equals(c2.artifactId()) &&
               c1.version().equals(c2.version());
    }

    /**
     * Determines if scope should be updated based on specificity.
     */
    private boolean shouldUpdateScope(String existingScope, String newScope) {
        // Priority: test > runtime > compile
        return switch (existingScope) {
            case "compile" -> !"compile".equals(newScope);
            case "runtime" -> "test".equals(newScope);
            case "test" -> false; // test is highest priority
            default -> true;
        };
    }
}
