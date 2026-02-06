package com.riskscanner.dependencyriskanalyzer.service.dependency;

import org.apache.maven.model.building.FileModelSource;
import org.apache.maven.model.building.ModelSource;
import org.apache.maven.model.resolution.InvalidRepositoryException;
import org.apache.maven.model.resolution.ModelResolver;
import org.apache.maven.model.resolution.UnresolvableModelException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Simple model resolver for building effective Maven models.
 *
 * <p>This resolver handles parent POM resolution from the local filesystem
 * and Maven Central. It's used by the ModelBuilder to create the effective
 * model with inherited properties and dependency management.
 */
public class SimpleModelResolver implements ModelResolver {

    private static final String MAVEN_CENTRAL = "https://repo.maven.apache.org/maven2/";

    @Override
    public ModelSource resolveModel(String groupId, String artifactId, String version) throws UnresolvableModelException {
        // Try local Maven repository first
        String relativePath = groupId.replace('.', '/') + '/' + artifactId + '/' + version + '/' + artifactId + '-' + version + ".pom";
        File localRepo = new File(System.getProperty("user.home"), ".m2/repository");
        File pomFile = new File(localRepo, relativePath);

        if (pomFile.exists()) {
            return new FileModelSource(pomFile);
        }

        // Download from Maven Central
        try {
            URL centralUrl = new URL(MAVEN_CENTRAL + relativePath);
            Path tempFile = Files.createTempFile(artifactId + "-" + version, ".pom");
            tempFile.toFile().deleteOnExit();
            
            try (InputStream is = centralUrl.openStream()) {
                Files.copy(is, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }
            
            return new FileModelSource(tempFile.toFile());
        } catch (IOException e) {
            throw new UnresolvableModelException(
                "Could not resolve POM from local repository or Maven Central: " + groupId + ":" + artifactId + ":" + version,
                groupId, artifactId, version);
        }
    }

    @Override
    public ModelSource resolveModel(org.apache.maven.model.Parent parent) throws UnresolvableModelException {
        return resolveModel(parent.getGroupId(), parent.getArtifactId(), parent.getVersion());
    }

    @Override
    public ModelSource resolveModel(org.apache.maven.model.Dependency dependency) throws UnresolvableModelException {
        return resolveModel(dependency.getGroupId(), dependency.getArtifactId(), dependency.getVersion());
    }

    @Override
    public void addRepository(org.apache.maven.model.Repository repository) throws InvalidRepositoryException {
        // Not needed for local-only resolution
    }

    @Override
    public void addRepository(org.apache.maven.model.Repository repository, boolean replace) throws InvalidRepositoryException {
        // Not needed for local-only resolution
    }

    @Override
    public ModelResolver newCopy() {
        return new SimpleModelResolver();
    }
}
