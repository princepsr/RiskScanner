package com.riskscanner.dependencyriskanalyzer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.riskscanner.dependencyriskanalyzer.dto.DependencyEnrichmentDto;
import com.riskscanner.dependencyriskanalyzer.model.DependencyCoordinate;
import com.riskscanner.dependencyriskanalyzer.model.RiskLevel;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * AI integration layer for the application.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Read current AI provider/model and API key through {@link AiSettingsService}.</li>
 *   <li>Call the OpenAI Chat Completions API via {@link OpenAiService}.</li>
 *   <li>Produce a structured per-dependency risk assessment (JSON) and parse it into
 *   {@link DependencyRiskAnalysisResult} for caching/export.</li>
 * </ul>
 *
 * <p>Notes for developers:
 * <ul>
 *   <li>The multi-dependency method {@link #analyzeDependencies(List)} is a legacy endpoint that returns free-form text.</li>
 *   <li>The per-dependency methods {@link #analyzeDependencyRisk(DependencyCoordinate)} and
 *   {@link #analyzeDependencyRisk(DependencyCoordinate, DependencyEnrichmentDto)} are the preferred APIs.</li>
 * </ul>
 */
@Service
public class AIAnalysisService {

    private final AiSettingsService aiSettingsService;
    private final ObjectMapper objectMapper;

    /**
     * Constructs an instance of the AI analysis service.
     *
     * @param aiSettingsService the AI settings service
     * @param objectMapper      the object mapper
     */
    public AIAnalysisService(AiSettingsService aiSettingsService, ObjectMapper objectMapper) {
        this.aiSettingsService = aiSettingsService;
        this.objectMapper = objectMapper;
    }

    /**
     * Analyzes the given dependencies for security vulnerabilities, known issues, and maintenance status.
     *
     * <p>This method is a legacy endpoint that returns free-form text. It is recommended to use
     * {@link #analyzeDependencyRisk(DependencyCoordinate)} or
     * {@link #analyzeDependencyRisk(DependencyCoordinate, DependencyEnrichmentDto)} instead.
     *
     * @param dependencies the dependencies to analyze
     * @return the analysis result as a string
     */
    public String analyzeDependencies(List<String> dependencies) {
        // Use a modern chat model like gpt-4o or gpt-3.5-turbo
        OpenAiService openAiService = new OpenAiService(aiSettingsService.getApiKeyOrThrow());

        // Chat models require a list of messages (System/User/Assistant)
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(),
                "You are a security expert specialized in Java dependency analysis."));
        messages.add(new ChatMessage(ChatMessageRole.USER.value(),
                buildPrompt(dependencies)));

        // Use ChatCompletionRequest instead of CompletionRequest
        ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                .model(aiSettingsService.getModel())
                .messages(messages)
                .maxTokens(1000)
                .temperature(0.7)
                .build();

        // Call the chat completion endpoint
        return openAiService.createChatCompletion(chatRequest)
                .getChoices().get(0).getMessage().getContent().trim();
    }

    /**
     * Tests that the currently configured provider/model/api key can successfully reach the AI provider.
     *
     * <p>This is used by the UI to validate configuration before running analysis.
     */
    public void testConnection() {
        String provider = aiSettingsService.getProvider();
        if (!"openai".equalsIgnoreCase(provider)) {
            throw new IllegalStateException("Unsupported AI provider: " + provider);
        }

        OpenAiService openAiService = new OpenAiService(aiSettingsService.getApiKeyOrThrow());

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), "Return exactly 'pong'."));
        messages.add(new ChatMessage(ChatMessageRole.USER.value(), "ping"));

        ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                .model(aiSettingsService.getModel())
                .messages(messages)
                .maxTokens(5)
                .temperature(0.0)
                .build();

        openAiService.createChatCompletion(chatRequest);
    }

    /**
     * Analyzes a single dependency using AI.
     *
     * <p>This overload performs analysis without enrichment. Prefer
     * {@link #analyzeDependencyRisk(DependencyCoordinate, DependencyEnrichmentDto)} when enrichment is available.
     *
     * @param dependency the dependency to analyze
     * @return the structured analysis result
     */
    public DependencyRiskAnalysisResult analyzeDependencyRisk(DependencyCoordinate dependency) {
        return analyzeDependencyRisk(dependency, null);
    }

    /**
     * Analyzes a single dependency using AI and optional enrichment.
     *
     * <p>Expected output is strict JSON that matches the schema described in
     * {@link #buildSingleDependencyPrompt(DependencyCoordinate, DependencyEnrichmentDto)}. If parsing fails,
     * the method returns a result with {@link RiskLevel#UNKNOWN} and includes the raw response text in
     * {@link DependencyRiskAnalysisResult#explanation()} for visibility.
     *
     * @param dependency the dependency to analyze
     * @param enrichment the enrichment data (optional)
     * @return the structured analysis result
     */
    public DependencyRiskAnalysisResult analyzeDependencyRisk(DependencyCoordinate dependency, DependencyEnrichmentDto enrichment) {
        if (dependency == null) {
            throw new IllegalArgumentException("dependency must not be null");
        }

        String provider = aiSettingsService.getProvider();
        if (!"openai".equalsIgnoreCase(provider)) {
            throw new IllegalStateException("Unsupported AI provider: " + provider);
        }

        OpenAiService openAiService = new OpenAiService(aiSettingsService.getApiKeyOrThrow());

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(),
                "You are a software supply-chain security expert. " +
                        "You must respond with STRICT JSON only (no markdown, no code fences)."));
        messages.add(new ChatMessage(ChatMessageRole.USER.value(), buildSingleDependencyPrompt(dependency, enrichment)));

        ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                .model(aiSettingsService.getModel())
                .messages(messages)
                .maxTokens(600)
                .temperature(0.2)
                .build();

        String content = openAiService.createChatCompletion(chatRequest)
                .getChoices().get(0).getMessage().getContent().trim();

        return parseDependencyRiskResult(content);
    }

    /**
     * Builds a prompt for analyzing multiple dependencies.
     *
     * @param dependencies the dependencies to analyze
     * @return the prompt
     */
    private String buildPrompt(List<String> dependencies) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze the following Java dependencies for security vulnerabilities, ");
        prompt.append("known issues, and maintenance status:\n\n");

        for (String dep : dependencies) {
            prompt.append("- ").append(dep).append("\n");
        }
        return prompt.toString();
    }

    /**
     * Builds a prompt for analyzing a single dependency.
     *
     * @param dependency the dependency to analyze
     * @param enrichment the enrichment data (optional)
     * @return the prompt
     */
    private String buildSingleDependencyPrompt(DependencyCoordinate dependency, DependencyEnrichmentDto enrichment) {
        StringBuilder sb = new StringBuilder();
        sb.append("Dependency: ")
                .append(dependency.groupId())
                .append(":")
                .append(dependency.artifactId())
                .append(":")
                .append(dependency.version())
                .append("\n");
        sb.append("BuildTool: ").append(dependency.buildTool()).append("\n");

        if (enrichment != null) {
            sb.append("\nEnrichment:\n");
            if (enrichment.vulnerabilityCount() != null) {
                sb.append("Known Vulnerabilities Count: ").append(enrichment.vulnerabilityCount()).append("\n");
            }
            if (enrichment.vulnerabilityIds() != null && !enrichment.vulnerabilityIds().isEmpty()) {
                sb.append("Vulnerability IDs: ").append(String.join(", ", enrichment.vulnerabilityIds())).append("\n");
            }
            if (enrichment.scmUrl() != null) {
                sb.append("SCM URL: ").append(enrichment.scmUrl()).append("\n");
            }
            if (enrichment.githubRepo() != null) {
                sb.append("GitHub Repo: ").append(enrichment.githubRepo()).append("\n");
            }
            if (enrichment.githubStars() != null) {
                sb.append("GitHub Stars: ").append(enrichment.githubStars()).append("\n");
            }
            if (enrichment.githubOpenIssues() != null) {
                sb.append("GitHub Open Issues: ").append(enrichment.githubOpenIssues()).append("\n");
            }
            if (enrichment.githubLastPushedAt() != null) {
                sb.append("GitHub Last Pushed At: ").append(enrichment.githubLastPushedAt()).append("\n");
            }
        }

        sb.append("\nTask: Estimate maintenance and security risk using the dependency identifier and enrichment (if present). ");
        sb.append("Provide a risk level and short plain-English explanation.\n\n");
        sb.append("Return JSON with this exact schema:\n");
        sb.append("{\n");
        sb.append("  \"riskLevel\": \"HIGH\" | \"MEDIUM\" | \"LOW\" | \"UNKNOWN\",\n");
        sb.append("  \"riskScore\": number (0-100),\n");
        sb.append("  \"explanation\": string,\n");
        sb.append("  \"recommendations\": [string]\n");
        sb.append("}");
        return sb.toString();
    }

    /**
     * Parses the result of the dependency risk analysis.
     *
     * @param json the result as JSON
     * @return the parsed result
     */
    private DependencyRiskAnalysisResult parseDependencyRiskResult(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            RiskLevel riskLevel;
            try {
                riskLevel = RiskLevel.valueOf(node.path("riskLevel").asText("UNKNOWN").toUpperCase());
            } catch (Exception ignored) {
                riskLevel = RiskLevel.UNKNOWN;
            }

            Integer riskScore = node.hasNonNull("riskScore") ? node.get("riskScore").asInt() : null;
            String explanation = node.path("explanation").asText("");

            List<String> recommendations = new ArrayList<>();
            JsonNode recs = node.path("recommendations");
            if (recs.isArray()) {
                for (JsonNode rec : recs) {
                    recommendations.add(rec.asText());
                }
            }

            return new DependencyRiskAnalysisResult(riskLevel, riskScore, explanation, recommendations);
        } catch (Exception e) {
            return new DependencyRiskAnalysisResult(RiskLevel.UNKNOWN, null, json, List.of());
        }
    }

    /**
     * Parsed structured result returned by the AI provider.
     */
    public record DependencyRiskAnalysisResult(
            RiskLevel riskLevel,
            Integer riskScore,
            String explanation,
            List<String> recommendations
    ) {
    }
}