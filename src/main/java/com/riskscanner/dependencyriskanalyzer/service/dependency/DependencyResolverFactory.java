package com.riskscanner.dependencyriskanalyzer.service.dependency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

/**
 * Factory for creating dependency resolvers based on project type.
 *
 * <p>This factory automatically detects the build tool type and returns
 * the appropriate resolver implementation with priority order:
 * <ol>
 *   <li>GradleExecutionDependencyResolver (HIGH/MEDIUM confidence) - production-grade Gradle execution</li>
 *   <li>Maven Aether resolver (HIGH confidence) for Maven projects</li>
 *   <li>GradleDependencyResolver (MEDIUM confidence) - legacy CLI fallback for Gradle projects</li>
 * </ol>
 */
@Component
public class DependencyResolverFactory {

    private static final Logger logger = LoggerFactory.getLogger(DependencyResolverFactory.class);

    private final List<DependencyResolver> resolvers;

    @Autowired
    public DependencyResolverFactory(List<DependencyResolver> resolvers) {
        this.resolvers = resolvers;
        logger.debug("Available dependency resolvers: {}", 
            resolvers.stream().map(r -> r.getClass().getSimpleName()).toList());
    }

    /**
     * Gets the appropriate dependency resolver for the given project path.
     *
     * <p>Selection priority:
     * <ol>
     *   <li>GradleExecutionDependencyResolver (HIGH/MEDIUM confidence) - production-grade Gradle execution</li>
     *   <li>MavenDependencyResolver (HIGH confidence) - for Maven projects</li>
     *   <li>GradleDependencyResolver (MEDIUM confidence) - legacy CLI fallback for Gradle projects</li>
     * </ol>
     *
     * @param projectPath path to the project
     * @return the resolver that supports this project type
     * @throws IllegalArgumentException if no resolver supports the project
     */
    public DependencyResolver getResolver(Path projectPath) {
        logger.debug("Selecting dependency resolver for project: {}", projectPath);
        
        // Filter resolvers that support this project
        List<DependencyResolver> supportedResolvers = resolvers.stream()
            .filter(r -> r.supports(projectPath))
            .toList();
        
        if (supportedResolvers.isEmpty()) {
            throw new IllegalArgumentException("No dependency resolver found for project: " + projectPath);
        }
        
        // Select resolver with priority order
        DependencyResolver selected = selectResolverByPriority(supportedResolvers);
        
        logger.info("Selected dependency resolver: {} for project: {}", 
            selected.getClass().getSimpleName(), projectPath);
        
        return selected;
    }

    /**
     * Selects the best resolver from the supported ones based on priority.
     */
    private DependencyResolver selectResolverByPriority(List<DependencyResolver> supportedResolvers) {
        // Priority 1: GradleExecutionDependencyResolver (HIGH/MEDIUM confidence)
        Optional<DependencyResolver> executionResolver = supportedResolvers.stream()
            .filter(r -> r.getClass().getSimpleName().equals("GradleExecutionDependencyResolver"))
            .findFirst();
        
        if (executionResolver.isPresent()) {
            return executionResolver.get();
        }
        
        // Priority 2: MavenDependencyResolver (HIGH confidence)
        Optional<DependencyResolver> mavenResolver = supportedResolvers.stream()
            .filter(r -> r.getClass().getSimpleName().equals("MavenDependencyResolver"))
            .findFirst();
        
        if (mavenResolver.isPresent()) {
            return mavenResolver.get();
        }
        
        // Priority 3: GradleDependencyResolver (MEDIUM confidence) - legacy fallback
        Optional<DependencyResolver> cliResolver = supportedResolvers.stream()
            .filter(r -> r.getClass().getSimpleName().equals("GradleDependencyResolver"))
            .findFirst();
        
        if (cliResolver.isPresent()) {
            return cliResolver.get();
        }
        
        // Fallback to first available resolver
        return supportedResolvers.get(0);
    }

    /**
     * Checks if any resolver supports the given project path.
     *
     * @param projectPath path to check
     * @return true if a resolver is available, false otherwise
     */
    public boolean supports(Path projectPath) {
        return resolvers.stream().anyMatch(r -> r.supports(projectPath));
    }

    /**
     * Gets all available resolvers.
     *
     * @return list of all resolvers
     */
    public List<DependencyResolver> getAllResolvers() {
        return List.copyOf(resolvers);
    }

    /**
     * Gets resolver information for debugging purposes.
     *
     * @param projectPath path to check
     * @return information about available and selected resolvers
     */
    public String getResolverInfo(Path projectPath) {
        StringBuilder info = new StringBuilder();
        info.append("Project: ").append(projectPath).append("\n");
        
        List<DependencyResolver> supported = resolvers.stream()
            .filter(r -> r.supports(projectPath))
            .toList();
        
        info.append("Supported resolvers: ").append(supported.size()).append("\n");
        for (DependencyResolver resolver : supported) {
            info.append("  - ").append(resolver.getClass().getSimpleName())
               .append(" (").append(resolver.getBuildTool()).append(")\n");
        }
        
        if (supports(projectPath)) {
            DependencyResolver selected = getResolver(projectPath);
            info.append("Selected: ").append(selected.getClass().getSimpleName()).append("\n");
        } else {
            info.append("Selected: None\n");
        }
        
        return info.toString();
    }
}
