package com.riskscanner.dependencyriskanalyzer.controller;

import com.riskscanner.dependencyriskanalyzer.service.DependencyScannerService;
import com.riskscanner.dependencyriskanalyzer.service.AIAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DependencyController {

    @Autowired
    private DependencyScannerService dependencyScannerService;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    // Endpoint to scan dependencies and analyze risks using AI
    @GetMapping("/scan-and-analyze-dependencies")
    public String scanAndAnalyzeDependencies(@RequestParam String filePath) {
        try {
            // Scan the dependencies (Maven or Gradle)
            List<String> dependencies = dependencyScannerService.scanDependencies(filePath);

            // Analyze the dependencies for risk using AI
            String analysis = aiAnalysisService.analyzeDependencies(dependencies);

            return analysis;  // Return the AI's analysis
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
}