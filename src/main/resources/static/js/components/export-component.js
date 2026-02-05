// Risk Scanner - Export Component

class ExportComponent {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'exportComponent',
      onExportComplete: options.onExportComplete || null,
      onError: options.onError || null,
      ...options
    };
    
    this.container = null;
    this.exportHistory = [];
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadExportHistory();
  }

  setupElements() {
    this.container = DOMUtils.$(this.options.containerId);
    if (!this.container) {
      console.error(`Export container not found: ${this.options.containerId}`);
      return;
    }
    
    this.createExportInterface();
  }

  createExportInterface() {
    this.container.innerHTML = `
      <div class="export-container">
        <div class="export-form">
          <h3 class="export__title">Export Options</h3>
          
          <div class="form-group">
            <label class="form-label">Export Format</label>
            <div class="export-format-options">
              <label class="radio-label">
                <input type="radio" name="exportFormat" value="json" checked>
                <span class="radio-text">JSON</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="exportFormat" value="pdf">
                <span class="radio-text">PDF</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="exportFormat" value="csv">
                <span class="radio-text">CSV</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Export Options</label>
            <div class="export-options">
              <label class="checkbox-label">
                <input type="checkbox" id="includeExplanations" checked>
                <span class="checkbox-text">Include AI explanations</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="includeMetadata" checked>
                <span class="checkbox-text">Include metadata</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="includeTimestamps" checked>
                <span class="checkbox-text">Add timestamp to filename</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Custom Filename (optional)</label>
            <input type="text" class="form-input" id="customFilename" placeholder="risk-report">
          </div>
          
          <div class="export-actions">
            <button type="button" class="btn btn--primary" id="exportBtn">
              <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button type="button" class="btn btn--outline" id="previewBtn">
              <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Preview
            </button>
          </div>
        </div>
        
        <div class="export-history">
          <h3 class="export__title">Export History</h3>
          <div class="export-history-list" id="exportHistoryList">
            <p class="text-muted">No exports yet</p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const exportBtn = DOMUtils.$('exportBtn');
    const previewBtn = DOMUtils.$('previewBtn');
    
    if (exportBtn) {
      DOMUtils.on(exportBtn, 'click', () => {
        this.handleExport();
      });
    }
    
    if (previewBtn) {
      DOMUtils.on(previewBtn, 'click', () => {
        this.handlePreview();
      });
    }
  }

  async handleExport() {
    const exportBtn = DOMUtils.$('exportBtn');
    const format = this.getSelectedFormat();
    const options = this.getExportOptions();
    
    // Disable button and show loading
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.innerHTML = `
        <div class="btn__spinner"></div>
        Exporting...
      `;
    }
    
    try {
      // Get current analysis data
      const analysisData = this.getCurrentAnalysisData();
      
      // Perform export
      const filename = this.generateFilename(format, options.customFilename);
      const result = await this.performExport(format, analysisData, filename, options);
      
      // Add to history
      this.addToExportHistory({
        format,
        filename,
        timestamp: new Date().toISOString(),
        size: result.size || 0,
        success: true
      });
      
      this.showSuccess(`Export completed: ${filename}`);
      
      if (this.options.onExportComplete) {
        this.options.onExportComplete(result);
      }
      
    } catch (error) {
      this.showError(`Export failed: ${error.message}`);
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    } finally {
      // Re-enable button
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `
          <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        `;
      }
    }
  }

  async handlePreview() {
    const format = this.getSelectedFormat();
    const options = this.getExportOptions();
    
    try {
      const analysisData = this.getCurrentAnalysisData();
      const preview = this.generatePreview(format, analysisData, options);
      
      this.showPreviewModal(preview, format);
      
    } catch (error) {
      this.showError(`Preview failed: ${error.message}`);
    }
  }

  getSelectedFormat() {
    const formatRadio = this.container.querySelector('input[name="exportFormat"]:checked');
    return formatRadio ? formatRadio.value : 'json';
  }

  getExportOptions() {
    return {
      includeExplanations: DOMUtils.$('includeExplanations')?.checked || false,
      includeMetadata: DOMUtils.$('includeMetadata')?.checked || false,
      includeTimestamps: DOMUtils.$('includeTimestamps')?.checked || false,
      customFilename: DOMUtils.$('customFilename')?.value || ''
    };
  }

  getCurrentAnalysisData() {
    // Get current analysis data from the dashboard or API
    return {
      projectPath: DOMUtils.$('projectPath')?.value || '',
      results: window.dashboardComponent?.vulnerabilityTable?.data || [],
      timestamp: new Date().toISOString()
    };
  }

  generateFilename(format, customFilename) {
    const baseName = customFilename || 'risk-report';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    if (DOMUtils.$('includeTimestamps')?.checked) {
      return `${baseName}-${timestamp}.${format}`;
    } else {
      return `${baseName}.${format}`;
    }
  }

  async performExport(format, data, filename, options) {
    switch (format) {
      case 'json':
        return await ExportUtils.exportToJSON(data, filename);
      case 'pdf':
        return await ExportUtils.exportToPDF(data, filename);
      case 'csv':
        return await ExportUtils.exportToCSV(data, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  generatePreview(format, data, options) {
    switch (format) {
      case 'json':
        return this.generateJSONPreview(data, options);
      case 'pdf':
        return this.generatePDFPreview(data, options);
      case 'csv':
        return this.generateCSVPreview(data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  generateJSONPreview(data, options) {
    const previewData = {
      projectPath: data.projectPath,
      exportTimestamp: data.timestamp,
      totalVulnerabilities: data.results.length,
      summary: this.generateSummary(data.results),
      ...(options.includeMetadata && { metadata: this.generateMetadata() }),
      ...(options.includeExplanations && { 
        explanations: data.results.slice(0, 3).map(item => ({
          dependency: item.dependency,
          explanation: item.aiExplanation ? 'AI analysis available' : 'No AI analysis'
        }))
      })
    };
    
    return JSON.stringify(previewData, null, 2);
  }

  generatePDFPreview(data, options) {
    let content = `
      <div class="pdf-preview">
        <h1>Risk Scanner Report</h1>
        <p><strong>Project Path:</strong> ${data.projectPath || 'N/A'}</p>
        <p><strong>Generated:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
        <p><strong>Total Vulnerabilities:</strong> ${data.results.length}</p>
    `;
    
    if (options.includeMetadata) {
      content += `
        <h2>Metadata</h2>
        <pre>${JSON.stringify(this.generateMetadata(), null, 2)}</pre>
      `;
    }
    
    content += `
        <h2>Summary</h2>
        <pre>${JSON.stringify(this.generateSummary(data.results), null, 2)}</pre>
    `;
    
    if (options.includeExplanations) {
      content += `
        <h2>Sample AI Explanations</h2>
      `;
      
      data.results.slice(0, 3).forEach(item => {
        content += `
          <div class="explanation">
            <h3>${this.formatDependency(item.dependency)}</h3>
            <p>${item.aiExplanation || 'No AI analysis available'}</p>
          </div>
        `;
      });
    }
    
    content += `</div>`;
    return content;
  }

  generateCSVPreview(data, options) {
    const headers = ['Dependency', 'Severity', 'Risk Score', 'Confidence', 'CVE ID'];
    
    if (options.includeExplanations) {
      headers.push('AI Explanation');
    }
    
    const rows = data.results.slice(0, 5).map(item => {
      const row = [
        this.formatDependency(item.dependency),
        item.severity || 'N/A',
        item.riskScore || 'N/A',
        item.confidenceLevel || 'N/A',
        item.vulnerability?.id || 'N/A'
      ];
      
      if (options.includeExplanations) {
        row.push(item.aiExplanation ? 'Available' : 'Not available');
      }
      
      return row.join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  generateSummary(results) {
    const summary = {
      total: results.length,
      bySeverity: {},
      byConfidence: {},
      averageRiskScore: 0
    };
    
    results.forEach(item => {
      // Count by severity
      const severity = item.severity || 'UNKNOWN';
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
      
      // Count by confidence
      const confidence = item.confidenceLevel || 'UNKNOWN';
      summary.byConfidence[confidence] = (summary.byConfidence[confidence] || 0) + 1;
      
      // Calculate average risk score
      if (item.riskScore) {
        summary.averageRiskScore += item.riskScore;
      }
    });
    
    if (results.length > 0) {
      summary.averageRiskScore = Math.round(summary.averageRiskScore / results.length);
    }
    
    return summary;
  }

  generateMetadata() {
    return {
      version: '1.0.0',
      tool: 'Risk Scanner',
      exportFormat: 'preview',
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
  }

  formatDependency(dependency) {
    if (typeof dependency === 'string') return dependency;
    if (dependency && dependency.artifactId) {
      return `${dependency.groupId}:${dependency.artifactId}:${dependency.version}`;
    }
    return 'Unknown';
  }

  showPreviewModal(preview, format) {
    // Create modal
    const modal = DOMUtils.createElement('div', {
      className: 'modal'
    });
    
    const modalContent = DOMUtils.createElement('div', {
      className: 'modal__content'
    });
    
    const modalHeader = DOMUtils.createElement('div', {
      className: 'modal__header'
    });
    
    const modalTitle = DOMUtils.createElement('h3', {
      className: 'modal__title',
      textContent: 'Export Preview (' + format.toUpperCase() + ')'
    });
    
    const closeBtn = DOMUtils.createElement('button', {
      className: 'modal__close',
      id: 'closePreview',
      textContent: '×'
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    
    const modalBody = DOMUtils.createElement('div', {
      className: 'modal__body'
    });
    
    const previewContent = DOMUtils.createElement('div', {
      className: 'preview-content'
    });
    
    const previewText = DOMUtils.createElement('pre', {
      className: 'preview-text',
      textContent: FormatUtils.escapeHtml(preview)
    });
    
    previewContent.appendChild(previewText);
    modalBody.appendChild(previewContent);
    
    const modalFooter = DOMUtils.createElement('div', {
      className: 'modal__footer'
    });
    
    const closeBtn2 = DOMUtils.createElement('button', {
      className: 'btn btn--outline',
      id: 'closePreviewBtn',
      textContent: 'Close'
    });
    
    modalFooter.appendChild(closeBtn2);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Setup close handlers
    const closeModal = () => {
      DOMUtils.remove(modal);
    };
    
    DOMUtils.on(closeBtn, 'click', closeModal);
    DOMUtils.on(closeBtn2, 'click', closeModal);
    
    // Close on backdrop click
    DOMUtils.on(modal, 'click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  addToExportHistory(exportItem) {
    this.exportHistory.unshift(exportItem);
    
    // Keep only last 10 exports
    if (this.exportHistory.length > 10) {
      this.exportHistory = this.exportHistory.slice(0, 10);
    }
    
    this.updateExportHistoryDisplay();
    this.saveExportHistory();
  }

  updateExportHistoryDisplay() {
    const historyList = DOMUtils.$('exportHistoryList');
    if (!historyList) return;
    
    if (this.exportHistory.length === 0) {
      historyList.innerHTML = '<p class="text-muted">No exports yet</p>';
      return;
    }
    
    let historyHTML = '';
    this.exportHistory.forEach(item => {
      const formatClass = item.format.toUpperCase();
      const statusClass = item.success ? 'success' : 'error';
      const statusSymbol = item.success ? '✓' : '✗';
      
      historyHTML += '<div class="export-history-item">';
      historyHTML += '<div class="export-history__info">';
      historyHTML += '<span class="export-history__format">' + formatClass + '</span>';
      historyHTML += '<span class="export-history__filename">' + item.filename + '</span>';
      historyHTML += '<span class="export-history__size">' + ExportUtils.formatFileSize(item.size) + '</span>';
      historyHTML += '</div>';
      historyHTML += '<div class="export-history__meta">';
      historyHTML += '<span class="export-history__time">' + FormatUtils.formatRelativeTime(item.timestamp) + '</span>';
      historyHTML += '<span class="export-history__status ' + statusClass + '">' + statusSymbol + '</span>';
      historyHTML += '</div>';
      historyHTML += '</div>';
    });
    
    historyList.innerHTML = historyHTML;
  }

  loadExportHistory() {
    try {
      const saved = localStorage.getItem('riskScanner_exportHistory');
      if (saved) {
        this.exportHistory = JSON.parse(saved);
        this.updateExportHistoryDisplay();
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  }

  saveExportHistory() {
    try {
      localStorage.setItem('riskScanner_exportHistory', JSON.stringify(this.exportHistory));
    } catch (error) {
      console.error('Failed to save export history:', error);
    }
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    // Create or update status message
    let statusElement = DOMUtils.$('exportStatus');
    
    if (!statusElement) {
      statusElement = DOMUtils.createElement('div', {
        id: 'exportStatus',
        className: 'status-message'
      });
      
      const exportForm = this.container.querySelector('.export-form');
      if (exportForm) {
        DOMUtils.prepend(exportForm, statusElement);
      }
    }
    
    statusElement.textContent = message;
    statusElement.className = `status-message status-message--${type}`;
    statusElement.hidden = false;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (statusElement) {
        statusElement.hidden = true;
      }
    }, 5000);
  }

  destroy() {
    this.container = null;
    this.exportHistory = [];
  }
}

// Auto-initialize when DOM is ready
DOMUtils.ready(() => {
  window.exportComponent = new ExportComponent({
    onExportComplete: (result) => {
      console.log('Export completed:', result);
    },
    onError: (error) => {
      console.error('Export error:', error);
    }
  });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportComponent;
}
