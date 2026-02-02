package com.riskscanner.dependencyriskanalyzer.controller;

import com.riskscanner.dependencyriskanalyzer.service.AIAnalysisService;
import com.riskscanner.dependencyriskanalyzer.service.DependencyScannerService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class DependencyAnalysisController {

    @Autowired
    private DependencyScannerService dependencyScannerService;
    @Autowired
    private AIAnalysisService aiAnalysisService;

    @PostMapping("/analyze-dependencies")
    public String analyzeDependencies(@RequestParam("filePath") String filePath) {
        try {
            // Read dependencies from the file (pom.xml or build.gradle)
            List<String> dependencies = dependencyScannerService.scanDependencies(filePath);

            // Analyze them using AI
            return aiAnalysisService.analyzeDependencies(dependencies);
        } catch (IOException e) {
            return "Error reading file: " + e.getMessage();
        } catch (Exception e) {
            return "AI analysis failed: " + e.getMessage();
        }
    }
}