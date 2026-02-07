package com.riskscanner.dependencyriskanalyzer.service.dependency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.util.HashSet;
import java.util.Set;

/**
 * Service for managing Gradle wrapper extraction and usage.
 * 
 * <p>This service provides a hybrid approach to Gradle execution:
 * <ol>
 *   <li>Try project's existing wrapper (gradlew/gradlew.bat)</li>
 *   <li>Extract bundled wrapper from application resources</li>
 *   <li>Fall back to system Gradle installation</li>
 *   <li>Fail gracefully with clear instructions</li>
 * </ol>
 */
@Service
public class GradleWrapperService {
    
    private static final Logger logger = LoggerFactory.getLogger(GradleWrapperService.class);
    
    private static final String WRAPPER_RESOURCE_PATH = "/gradle-wrapper/";
    private static final String BUNDLED_WRAPPER_DIR = ".buildaegis-gradle-wrapper";
    
    /**
     * Resolves the best available Gradle command for the given project path.
     * 
     * @param projectPath path to the project directory
     * @return path to Gradle executable or command
     * @throws IOException if unable to resolve any Gradle installation
     */
    public String resolveGradleCommand(Path projectPath) throws IOException {
        logger.debug("Resolving Gradle command for project: {}", projectPath);
        
        // 1. Try project's existing wrapper
        String projectWrapper = findProjectWrapper(projectPath);
        if (projectWrapper != null) {
            logger.info("Using project's Gradle wrapper: {}", projectWrapper);
            return projectWrapper;
        }
        
        // 2. Extract and use bundled wrapper
        String bundledWrapper = extractBundledWrapper(projectPath);
        if (bundledWrapper != null) {
            logger.info("Using bundled Gradle wrapper: {}", bundledWrapper);
            return bundledWrapper;
        }
        
        // 3. Try system Gradle
        if (isSystemGradleAvailable()) {
            logger.info("Using system Gradle installation");
            return "gradle";
        }
        
        // 4. Fail with helpful message
        throw new IllegalStateException(
            "Gradle not found. Please install Gradle (https://gradle.org/install/) " +
            "or ensure your project has a Gradle wrapper (gradlew/gradlew.bat)."
        );
    }
    
    /**
     * Finds the project's existing Gradle wrapper.
     */
    private String findProjectWrapper(Path projectPath) {
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        
        Path gradlew = projectPath.resolve("gradlew");
        Path gradlewBat = projectPath.resolve("gradlew.bat");
        
        if (isWindows && gradlewBat.toFile().exists()) {
            return gradlewBat.toString();
        } else if (gradlew.toFile().exists()) {
            return gradlew.toString();
        }
        
        return null;
    }
    
    /**
     * Extracts bundled Gradle wrapper to project directory.
     */
    private String extractBundledWrapper(Path projectPath) throws IOException {
        Path wrapperDir = projectPath.resolve(BUNDLED_WRAPPER_DIR);
        
        try {
            Files.createDirectories(wrapperDir);
            
            // Extract wrapper files
            extractResource(WRAPPER_RESOURCE_PATH + "gradlew", wrapperDir.resolve("gradlew"));
            extractResource(WRAPPER_RESOURCE_PATH + "gradlew.bat", wrapperDir.resolve("gradlew.bat"));
            
            // Create gradle/wrapper directory and extract wrapper jar
            Path gradleWrapperDir = wrapperDir.resolve("gradle/wrapper");
            Files.createDirectories(gradleWrapperDir);
            extractResource(WRAPPER_RESOURCE_PATH + "gradle/wrapper/gradle-wrapper.jar", 
                          gradleWrapperDir.resolve("gradle-wrapper.jar"));
            extractResource(WRAPPER_RESOURCE_PATH + "gradle/wrapper/gradle-wrapper.properties",
                          gradleWrapperDir.resolve("gradle-wrapper.properties"));
            
            // Set executable permission on Unix systems
            if (!System.getProperty("os.name").toLowerCase().contains("win")) {
                Set<PosixFilePermission> permissions = new HashSet<>();
                permissions.add(PosixFilePermission.OWNER_READ);
                permissions.add(PosixFilePermission.OWNER_WRITE);
                permissions.add(PosixFilePermission.OWNER_EXECUTE);
                permissions.add(PosixFilePermission.GROUP_READ);
                permissions.add(PosixFilePermission.GROUP_EXECUTE);
                permissions.add(PosixFilePermission.OTHERS_READ);
                permissions.add(PosixFilePermission.OTHERS_EXECUTE);
                
                try {
                    Files.setPosixFilePermissions(wrapperDir.resolve("gradlew"), permissions);
                } catch (UnsupportedOperationException e) {
                    // Windows system, ignore
                    logger.debug("Cannot set POSIX permissions on Windows");
                }
            }
            
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            Path wrapperExecutable = isWindows ? wrapperDir.resolve("gradlew.bat") : wrapperDir.resolve("gradlew");
            
            return wrapperExecutable.toString();
            
        } catch (Exception e) {
            logger.warn("Failed to extract bundled Gradle wrapper: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extracts a resource from the JAR to the target path.
     */
    private void extractResource(String resourcePath, Path targetPath) throws IOException {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IOException("Resource not found: " + resourcePath);
            }
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }
    }
    
    /**
     * Checks if system Gradle is available.
     */
    private boolean isSystemGradleAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("gradle", "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            boolean finished = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return false;
            }
            
            return process.exitValue() == 0;
        } catch (Exception e) {
            logger.debug("System Gradle not available: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Cleans up extracted wrapper files.
     */
    public void cleanupExtractedWrapper(Path projectPath) {
        Path wrapperDir = projectPath.resolve(BUNDLED_WRAPPER_DIR);
        if (Files.exists(wrapperDir)) {
            try {
                deleteDirectory(wrapperDir);
                logger.debug("Cleaned up extracted Gradle wrapper: {}", wrapperDir);
            } catch (IOException e) {
                logger.warn("Failed to cleanup extracted wrapper: {}", e.getMessage());
            }
        }
    }
    
    /**
     * Recursively deletes a directory.
     */
    private void deleteDirectory(Path directory) throws IOException {
        if (Files.exists(directory)) {
            Files.walk(directory)
                 .sorted((a, b) -> -a.compareTo(b)) // Delete files before directories
                 .forEach(path -> {
                     try {
                         Files.delete(path);
                     } catch (IOException e) {
                         logger.warn("Failed to delete: {}", path);
                     }
                 });
        }
    }
}
