package com.riskscanner.dependencyriskanalyzer.service.dependency;

import com.riskscanner.dependencyriskanalyzer.model.DependencyNode;

import java.nio.file.Path;
import java.util.List;

/**
 * Resolves dependency graphs for build tools.
 *
 * <p>Implementations should:
 * <ul>
 *   <li>Parse build files (pom.xml, build.gradle, build.gradle.kts)</li>
 *   <li>Resolve transitive dependencies</li>
 *   <li>Build dependency trees with proper parent-child relationships</li>
 *   <li>Include dependency scopes and paths</li>
 * </ul>
 */
public interface DependencyResolver {

    /**
     * Resolves the complete dependency graph for a project.
     *
     * @param projectPath path to the project root or build file
     * @return list of root dependency nodes with their transitive dependencies
     */
    List<DependencyNode> resolveDependencies(Path projectPath);

    /**
     * Checks if this resolver can handle the given project.
     *
     * @param projectPath path to check
     * @return true if this resolver supports the project type
     */
    boolean supports(Path projectPath);

    /**
     * Gets the build tool type this resolver supports.
     *
     * @return the build tool type
     */
    BuildTool getBuildTool();

    enum BuildTool {
        MAVEN,
        GRADLE
    }
}
