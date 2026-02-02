package com.riskscanner.dependencyriskanalyzer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.riskscanner.dependencyriskanalyzer.dto.ProjectAnalysisRequest;
import com.riskscanner.dependencyriskanalyzer.service.ProjectAnalysisService;
import com.riskscanner.dependencyriskanalyzer.service.PdfExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * Export endpoints for reports.
 *
 * <p>Both endpoints accept a {@link ProjectAnalysisRequest} and invoke the same analysis pipeline as
 * {@code /api/project/analyze}. The response is returned as a downloadable attachment.
 */
@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ProjectAnalysisService projectAnalysisService;
    private final ObjectMapper objectMapper;
    private final PdfExportService pdfExportService;

    public ExportController(ProjectAnalysisService projectAnalysisService, ObjectMapper objectMapper, PdfExportService pdfExportService) {
        this.projectAnalysisService = projectAnalysisService;
        this.objectMapper = objectMapper;
        this.pdfExportService = pdfExportService;
    }

    /**
     * Generates an analysis and returns it as a JSON download.
     */
    @PostMapping(value = "/json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportJson(@RequestBody ProjectAnalysisRequest request) throws Exception {
        var response = projectAnalysisService.analyze(request);

        String filename = "risk-report-" + Instant.now().toString().replace(":", "-") + ".json";
        byte[] bytes = objectMapper.writeValueAsBytes(response);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .contentLength(bytes.length)
                .body(bytes);
    }

    /**
     * Generates an analysis and returns it as a PDF download.
     */
    @PostMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(@RequestBody ProjectAnalysisRequest request) throws Exception {
        var response = projectAnalysisService.analyze(request);
        byte[] pdfBytes = pdfExportService.generate(response);

        String filename = "risk-report-" + Instant.now().toString().replace(":", "-") + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}
