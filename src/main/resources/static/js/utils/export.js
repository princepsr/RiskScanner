// Risk Scanner - Export Utility Functions

window.ExportUtils = {
  /**
   * Export vulnerability findings to JSON file
   */
  async exportToJSON(data, filename = 'risk-report.json') {
    try {
      const payload = {
        projectPath: data.projectPath || '',
        forceRefresh: data.forceRefresh || false,
        includeExplanations: data.includeExplanations || false
      };
      
      const response = await window.riskScannerAPI.downloadPost('/api/export/json', payload, filename);
      
      return response;
    } catch (error) {
      throw new Error(`Failed to export JSON: ${error.message}`);
    }
  },

  /**
   * Export vulnerability findings to PDF file
   */
  async exportToPDF(data, filename = 'risk-report.pdf') {
    try {
      const payload = {
        projectPath: data.projectPath || '',
        forceRefresh: data.forceRefresh || false,
        includeExplanations: data.includeExplanations || false
      };
      
      const response = await window.riskScannerAPI.downloadPost('/api/export/pdf', payload, filename);
      
      return response;
    } catch (error) {
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
  },

  /**
   * Export scan results to JSON file
   */
  async exportScanResults(data, filename = 'scan-results.json') {
    try {
      const payload = {
        projectPath: data.projectPath || '',
        forceRefresh: data.forceRefresh || false,
        includeExplanations: data.includeExplanations || false
      };
      
      const response = await window.riskScannerAPI.downloadPost('/api/export/scan-results', payload, filename);
      
      return response;
    } catch (error) {
      throw new Error(`Failed to export scan results: ${error.message}`);
    }
  },

  /**
   * Export vulnerability findings with AI explanations
   */
  async exportWithAIExplanations(data, filename = 'risk-report-with-ai.json') {
    try {
      const payload = {
        projectPath: data.projectPath || '',
        forceRefresh: data.forceRefresh || false,
        includeExplanations: data.includeExplanations || false,
        includeAI: data.includeAI || false
      };
      
      const response = await window.riskScannerAPI.downloadPost('/api/export/ai-explanations', payload, filename);
      
      return response;
    } catch (error) {
      throw new Error(`Failed to export with AI explanations: ${error.message}`);
    }
  },

  /**
   * Export vulnerability findings as CSV
   */
  async exportToCSV(data, filename = 'risk-report.csv') {
    try {
      const payload = {
        projectPath: data.projectPath || '',
        forceRefresh: data.forceRefresh || false,
        includeExplanations: data.includeExplanations || false,
        includeAI: data.includeAI || false
      };
      
      const response = await window.riskScannerAPI.downloadPost('/api/export/csv', payload, filename);
      
      return response;
    } catch (error) {
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes < k) return `${bytes} Bytes`;
    
    for (let i = 0; i < sizes.length; i++) {
      const size = Math.floor(bytes / k);
      if (size > 0) {
        return `${size} ${sizes[i]}`;
      }
      bytes = bytes / k;
    }
    
    return `${bytes} Bytes`;
  },

  /**
   * Get export statistics
   */
  getExportStats() {
    return {
      totalExports: this.getExportCount(),
      cacheHits: this.getCacheHits(),
      cacheSize: this.getCacheSize()
    };
  },

  /**
   * Get export count
   */
  getExportCount() {
    return this.exportCount || 0;
  },

  /**
   * Get cache hits
   */
  getCacheHits() {
    return this.cacheHits || 0;
  },

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache ? this.cache.size : 0;
  },

  /**
   * Clear cache
   */
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  },

  /**
   * Create export filename with timestamp
   */
  createExportFilename(baseName, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${baseName}-${timestamp}.${extension}`;
  },

  /**
   * Validate export data
   */
  validateExportData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid export data: data must be an object');
    }
    
    if (data.projectPath && typeof data.projectPath !== 'string') {
      throw new Error('Invalid projectPath: must be a string');
    }
    
    return true;
  },

  /**
   * Get export options from form
   */
  getExportOptions() {
    const projectPath = DOMUtils.$('projectPath')?.value || '';
    const includeExplanations = DOMUtils.$('includeExplanations')?.checked || false;
    const includeAI = DOMUtils.$('includeAI')?.checked || false;
    const forceRefresh = DOMUtils.$('forceRefresh')?.value === 'true';
    
    return {
      projectPath,
      includeExplanations,
      includeAI,
      forceRefresh
    };
  },

  /**
   * Show export progress
   */
  showExportProgress(format) {
    const statusElement = DOMUtils.$('projectStatus');
    if (statusElement) {
      statusElement.textContent = `Exporting ${format.toUpperCase()}...`;
      statusElement.className = 'status-message status-message--info';
    }
  },

  /**
   * Show export success
   */
  showExportSuccess(format, filename) {
    const statusElement = DOMUtils.$('projectStatus');
    if (statusElement) {
      statusElement.textContent = `Exported ${format.toUpperCase()} successfully: ${filename}`;
      statusElement.className = 'status-message status-message--success';
    }
  },

  /**
   * Show export error
   */
  showExportError(format, error) {
    const statusElement = DOMUtils.$('projectStatus');
    if (statusElement) {
      statusElement.textContent = `Failed to export ${format.toUpperCase()}: ${error}`;
      statusElement.className = 'status-message status-message--error';
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportUtils;
}
