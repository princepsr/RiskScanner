package com.riskscanner.dependencyriskanalyzer.service.dependency;

import com.riskscanner.dependencyriskanalyzer.model.DependencyCoordinate;
import com.riskscanner.dependencyriskanalyzer.model.DependencyNode;
import com.riskscanner.dependencyriskanalyzer.model.ResolutionConfidence;
import org.apache.maven.model.Model;
import org.apache.maven.model.io.xpp3.MavenXpp3Reader;
import org.apache.maven.model.building.DefaultModelBuilderFactory;
import org.apache.maven.model.building.DefaultModelBuildingRequest;
import org.apache.maven.model.building.ModelBuildingException;
import org.apache.maven.model.building.ModelBuildingRequest;
import org.eclipse.aether.RepositorySystem;
import org.eclipse.aether.RepositorySystemSession;
import org.eclipse.aether.DefaultRepositorySystemSession;
import org.eclipse.aether.artifact.Artifact;
import org.eclipse.aether.artifact.DefaultArtifact;
import org.eclipse.aether.collection.CollectRequest;
import org.eclipse.aether.connector.basic.BasicRepositoryConnectorFactory;
import org.eclipse.aether.graph.Dependency;
import org.eclipse.aether.impl.DefaultServiceLocator;
import org.eclipse.aether.repository.LocalRepository;
import org.eclipse.aether.repository.RemoteRepository;
import org.eclipse.aether.spi.connector.RepositoryConnectorFactory;
import org.eclipse.aether.spi.connector.transport.TransporterFactory;
import org.eclipse.aether.transport.http.HttpTransporterFactory;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Maven dependency resolver using Maven Resolver (Aether).
 *
 * <p>This resolver:
 * <ul>
 *   <li>Parses pom.xml files using Maven Model</li>
 *   <li>Resolves transitive dependencies using Aether</li>
 *   <li>Builds dependency trees with proper scopes</li>
 *   <li>Handles dependency management and parent POM inheritance</li>
 * </ul>
 */
@Component
public class MavenDependencyResolver implements DependencyResolver {

    private static final String MAVEN_CENTRAL = "https://repo.maven.apache.org/maven2/";

    @Override
    public List<DependencyNode> resolveDependencies(Path projectPath) {
        try {
            // Find pom.xml
            Path pomFile = findPomFile(projectPath);
            if (pomFile == null) {
                throw new IllegalArgumentException("No pom.xml found in " + projectPath);
            }

            // Parse Maven model
            Model model = parseMavenModel(pomFile);
            
            // Initialize repository system
            RepositorySystem repositorySystem = newRepositorySystem();
            RepositorySystemSession session = newRepositorySession(repositorySystem);
            
            // Create remote repositories
            List<RemoteRepository> repositories = List.of(
                    new RemoteRepository.Builder("central", "default", MAVEN_CENTRAL).build()
            );

            // Create root artifact
            Artifact rootArtifact = new DefaultArtifact(
                model.getGroupId(), 
                model.getArtifactId(), 
                model.getPackaging(), 
                model.getVersion()
            );

            // Collect dependencies
            CollectRequest collectRequest = new CollectRequest();
            collectRequest.setRoot(new Dependency(rootArtifact, "compile"));
            
            // Add direct dependencies from POM
            model.getDependencies().forEach(dep -> {
                Artifact artifact = new DefaultArtifact(
                    dep.getGroupId(),
                    dep.getArtifactId(),
                    dep.getType() != null ? dep.getType() : "jar",
                    dep.getClassifier(),
                    dep.getVersion()
                );
                String scope = (dep.getScope() == null || dep.getScope().isBlank()) ? "compile" : dep.getScope();
                collectRequest.addDependency(new Dependency(artifact, scope));
            });

            collectRequest.setRepositories(repositories);

            // Resolve dependency tree
            org.eclipse.aether.graph.DependencyNode aetherRoot = repositorySystem
                    .collectDependencies(session, collectRequest)
                    .getRoot();

            // Convert to our model. We return the project's direct dependencies as roots.
            List<DependencyNode> roots = new ArrayList<>();
            for (org.eclipse.aether.graph.DependencyNode child : aetherRoot.getChildren()) {
                roots.add(convertNode(child, List.of(), true));
            }
            return roots;

        } catch (Exception e) {
            throw new RuntimeException("Failed to resolve Maven dependencies", e);
        }
    }

    @Override
    public boolean supports(Path projectPath) {
        return findPomFile(projectPath) != null;
    }

    @Override
    public BuildTool getBuildTool() {
        return BuildTool.MAVEN;
    }

    private Path findPomFile(Path projectPath) {
        Path pomFile = projectPath.resolve("pom.xml");
        if (Files.exists(pomFile)) {
            return pomFile;
        }
        
        // If the path itself is a pom.xml file
        if (projectPath.getFileName().toString().equals("pom.xml")) {
            return projectPath;
        }
        
        return null;
    }

    private Model parseMavenModel(Path pomFile) throws IOException, XmlPullParserException {
        MavenXpp3Reader reader = new MavenXpp3Reader();
        try (FileReader fileReader = new FileReader(pomFile.toFile())) {
            Model model = reader.read(fileReader);
            
            // Build the model to resolve inheritance and variables
            DefaultModelBuilderFactory factory = new DefaultModelBuilderFactory();
            ModelBuildingRequest request = new DefaultModelBuildingRequest()
                .setPomFile(pomFile.toFile())
                .setProcessPlugins(false)
                .setValidationLevel(ModelBuildingRequest.VALIDATION_LEVEL_MINIMAL)
                .setSystemProperties(System.getProperties());
            
            try {
                return factory.newInstance().build(request).getEffectiveModel();
            } catch (ModelBuildingException e) {
                // If building fails, return the raw model
                return model;
            }
        }
    }

    private DependencyNode convertNode(
            org.eclipse.aether.graph.DependencyNode aetherNode,
            List<String> pathFromRoot,
            boolean direct
    ) {
        Artifact artifact = aetherNode.getArtifact();
        String scope = "compile";
        if (aetherNode.getDependency() != null && aetherNode.getDependency().getScope() != null) {
            scope = aetherNode.getDependency().getScope();
        }
        
        DependencyCoordinate coordinate = new DependencyCoordinate(
                artifact.getGroupId(),
                artifact.getArtifactId(),
                artifact.getVersion(),
                "maven",
                scope
        );

        DependencyNode node = new DependencyNode(coordinate, scope, pathFromRoot, direct, ResolutionConfidence.HIGH);

        List<String> childPath = new ArrayList<>(pathFromRoot);
        childPath.add(coordinate.toString());
        for (org.eclipse.aether.graph.DependencyNode child : aetherNode.getChildren()) {
            node.addChild(convertNode(child, childPath, false));
        }
        return node;
    }

    private RepositorySystem newRepositorySystem() {
        DefaultServiceLocator locator = new DefaultServiceLocator();
        locator.addService(RepositoryConnectorFactory.class, BasicRepositoryConnectorFactory.class);
        locator.addService(TransporterFactory.class, HttpTransporterFactory.class);
        return locator.getService(RepositorySystem.class);
    }

    private RepositorySystemSession newRepositorySession(RepositorySystem system) {
        DefaultRepositorySystemSession session = new DefaultRepositorySystemSession();
        LocalRepository localRepo = new LocalRepository(System.getProperty("user.home") + File.separator + ".m2" + File.separator + "repository");
        session.setLocalRepositoryManager(system.newLocalRepositoryManager(session, localRepo));
        return session;
    }
}
