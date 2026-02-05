// Risk Scanner - Dashboard Component

class DashboardComponent {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'dashboard',
      autoRefresh: options.autoRefresh || false,
      refreshInterval: options.refreshInterval || 30000, // 30 seconds
      onAnalysisComplete: options.onAnalysisComplete || null,
      onError: options.onError || null,
      ...options
    };
    
    this.container = null;
    this.fileUpload = null;
    this.vulnerabilityTable = null;
    this.riskChart = null;
    this.aiExplanation = null;
    this.refreshTimer = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupComponents();
    this.setupEventListeners();
    
    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  setupElements() {
    this.container = DOMUtils.$(this.options.containerId);
    if (!this.container) {
      console.error(`Dashboard container not found: ${this.options.containerId}`);
      return;
    }
  }

  setupComponents() {
    // Initialize components if they exist
    if (window.FileUploadComponent) {
      this.fileUpload = new FileUploadComponent({
        onFileSelect: (file) => this.handleFileSelect(file),
        onError: (errors) => this.handleError(errors)
      });
    }
    
    if (window.VulnerabilityTableComponent) {
      this.vulnerabilityTable = new VulnerabilityComponent({
        onRowClick: (item) => this.handleRowClick(item),
        onSort: (column, direction) => this.handleSort(column, direction),
        onFilter: (filters, count) => this.handleFilter(filters, count)
      });
    }
    
    if (window.RiskChartComponent) {
      this.riskChart = new RiskChartComponent({
        onChartClick: (data) => this.handleChartClick(data)
      });
    }
    
    if (window.AIExplanationComponent) {
      this.aiExplanation = new AIExplanationComponent({
        onError: (error) => this.handleError(error)
      });
    }
  }

  setupEventListeners() {
    // Setup analysis buttons
    const analyzeBtn = DOMUtils.$('analyzeBtn');
    const scanBtn = DOMUtils.$('scanBtn');
    const loadCachedBtn = DOMUtils.$('loadCachedBtn');
    
    if (analyzeBtn) {
      DOMUtils.on(analyzeBtn, 'click', () => this.handleAnalyze());
    }
    
    if (scanBtn) {
      DOMUtils.on(scanBtn, 'click', () => this.handleScan());
    }
    
    if (loadCachedBtn) {
      DOMUtils.on(loadCachedBtn, 'click', () => this.handleLoadCached());
    }
    
    // Setup export buttons
    const exportJsonBtn = DOMUtils.$('exportJson');
    const exportPdfBtn = DOMUtils.$('exportPdf');
    
    if (exportJsonBtn) {
      DOMUtils.on(exportJsonBtn, 'click', () => this.handleExport('json'));
    }
    
    if (exportPdfBtn) {
      DOMUtils.on(exportPdfBtn, 'click', () => this.handleExport('pdf'));
    }
  }

  handleFileSelect(file) {
    this.showStatus('File selected: ' + file.name, 'success');
    this.enableAnalysisButtons();
    
    if (this.options.onFileSelect) {
      this.options.onFileSelect(file);
    }
  }

  handleError(error) {
    console.error('Dashboard error:', error);
    this.showStatus(error, 'error');
    
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  handleRowClick(item) {
    console.log('Row clicked:', item);
    
    // Show AI explanation if available
    if (this.aiExplanation && item.aiExplanation) {
      this.showAIExplanation(item);
    }
    
    if (this.options.onRowClick) {
      this.options.onRowClick(item);
    }
  }

  handleSort(column, direction) {
    console.log('Table sorted:', column, direction);
    
    if (this.options.onSort) {
      this.options.onSort(column, direction);
    }
  }

  handleFilter(filters, count) {
    console.log('Table filtered:', filters, count);
    
    if (this.options.onFilter) {
      this.options.onFilter(filters, count);
    }
  }

  handleChartClick(data) {
    console.log('Chart clicked:', data);
    
    if (this.options.onChartClick) {
      this.options.onChartClick(data);
    }
  }

  showAIExplanation(item) {
    if (!this.aiExplanation) return;
    
    const dependencyPath = this.getDependencyPath(item);
    
    this.aiExplanation.generateExplanation(item, dependencyPath)
      .then(explanation => {
        console.log('AI explanation generated:', explanation);
      })
      .catch(error => {
        console.error('AI explanation failed:', error);
      });
  }

  getDependencyPath(item) {
    // This would calculate the dependency path from the analysis context
    // For now, return a simple path
    return [item.dependency];
  }

  handleAnalyze() {
    if (!this.fileUpload || !this.fileUpload.hasFile()) {
      this.showStatus('Please upload a build file first', 'error');
      return;
    }
    
    const file = this.fileUpload.getFile();
    const options = this.getAnalysisOptions();
    
    try {
      this.showStatus('Analyzing dependencies...', 'info');
      this.disableAnalysisButtons();
      
      // Call the API
      window.riskScannerAPI.uploadFile(file, options)
        .then(result => {
          this.showStatus('Analysis complete!', 'success');
          this.enableAnalysisButtons();
          
          // Update components
          if (this.vulnerabilityTable) {
            this.vulnerabilityTable.render(result.results || []);
          }
          
          if (this.riskChart) {
            this.riskChart.render(result.results || []);
          }
          
          // Show results section
          const resultsSection = DOMUtils.$('resultsSection');
          if (resultsSection) {
            DOMUtils.show(resultsSection);
          }
          
          if (this.options.onAnalysisComplete) {
            this.options.onAnalysisComplete(result);
          }
        })
        .catch(error => {
          this.showStatus('Analysis failed: ' + error.message, 'error');
          this.enableAnalysisButtons();
          
          if (this.options.onError) {
            this.options.onError(error);
          }
        });
      // Update components
      if (this.vulnerabilityTable) {
        this.vulnerabilityTable.render(result.results || []);
      }
      
      if (this.riskChart) {
        this.riskChart.render(result.results || []);
      }
      
      // Show results section
      const resultsSection = DOMUtils.$('resultsSection');
      if (resultsSection) {
        DOMUtils.show(resultsSection);
      }
      
      if (this.options.onAnalysisComplete) {
        this.options.onAnalysisComplete(result);
      }
      
    } catch (error) {
      this.showStatus('Analysis failed: ' + error.message, 'error');
      this.enableAnalysisButtons();
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  async  handleScan() {
    if (!this.fileUpload || !this.fileUpload.hasFile()) {
      this.showStatus('Please upload a build file first', 'error');
      return;
    }
    
    const file = this.fileUpload.getFile();
    const options = this.getAnalysisOptions();
    
    try {
      this.showStatus('Scanning dependencies...', 'info');
      this.disableAnalysisButtons();
      
      // Call the API for scan only
      window.riskScannerAPI.uploadFile(file, { 
        scanOnly: true,
        ...this.getAnalysisOptions()
      })
        .then(result => {
          this.showStatus('Scan complete!', 'success');
          this.enableAnalysisButtons();
          
          // Update table with scan results (dependencies without vulnerabilities)
          if (this.vulnerabilityTable) {
            this.vulnerabilityTable.renderScanResults(result.results || []);
          }
          
          if (this.options.onAnalysisComplete) {
            this.options.onAnalysisComplete(result);
          }
        })
        .catch(error => {
          this.showStatus('Scan failed: ' + error.message, 'error');
          this.enableAnalysisButtons();
          
          if (this.options.onError) {
            this.options.onError(error);
          }
        });
      
    } catch (error) {
      this.showStatus('Scan failed: ' + error.message, 'error');
      this.enableAnalysisButtons();
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  async handleLoadCached() {
    try {
      this.showStatus('Loading cached results...', 'info');
      
      const results = await window.riskScannerAPI.getCachedResults();
      
      if (results && results.length > 0) {
        this.showStatus(`Loaded ${results.length} cached results`, 'success');
        
        // Update components
        if (this.vulnerabilityTable) {
          this.vulnerabilityTable.render(results);
        }
        
        if (this.riskChart) {
          this.riskChart.render(results);
        }
        
        // Show results section
        const resultsSection = DOMUtils.$('resultsSection');
        if (resultsSection) {
          DOMUtils.show(resultsSection);
        }
        
        if (this.options.onAnalysisComplete) {
          this.options.onAnalysisComplete({ results });
        }
        
      } else {
        this.showStatus('No cached results found', 'info');
      }
      
    } catch (error) {
      this.showStatus('Failed to load cached results: ' + error.message, 'error');
    }
  }

  handleExport(format) {
    try {
      this.showStatus(`Exporting ${format.toUpperCase()}...`, 'info');
      
      const projectPath = DOMUtils.$('projectPath')?.value || '';
      const payload = {
        projectPath: projectPath,
        forceRefresh: false
      };
      
      if (format === 'json') {
        await window.riskScannerAPI.exportJSON(payload, 'risk-report.json');
      } else if (format === 'pdf') {
        await window.riskScannerAPI.exportPDF(payload, 'risk-report.pdf');
      }
      
      this.showStatus(`Exported ${format.toUpperCase()} successfully`, 'success');
      
    } catch (error) {
      this.showStatus(`Export failed: ${error.message}`, 'error');
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  getAnalysisOptions() {
    return {
      buildTool: DOMUtils.$('buildTool')?.value || 'auto',
      analysisMode: DOMUtils.$('analysisMode')?.value || 'safe',
      includeExplanations: DOMUtils.$('includeExplanations')?.checked ?? true,
      forceRefresh: DOMUtils.$('forceRefresh')?.value === 'true'
    };
  }

  enableAnalysisButtons() {
    const analyzeBtn = DOMUtils.$('analyzeBtn');
    const scanBtn = DOMUtils.$('scanBtn');
    
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
    }
    
    if (scanBtn) {
      scanBtn.disabled = false;
    }
  }

  disableAnalysisButtons() {
    const analyzeBtn = {
      analyzeBtn: DOMUtils.$('analyzeBtn'),
      scanBtn: DOMUtils.$('scanBtn')
    };
    
    Object.values(analyzeBtn).forEach(btn => {
      if (btn) {
        btn.disabled = true;
      }
    });
  }

  showStatus(message, type = 'info') {
    const statusElement = DOMUtils.$('projectStatus');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.hidden = !message;
      
      // Update classes based on type
      statusElement.className = 'status-message status-message--' + type;
    }
  }

  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.handleLoadCached();
    }, this.options.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  refresh() {
    return this.handleLoadCached();
  }

  getStats() {
    return {
      hasFile: this.fileUpload ? this.fileUpload.hasFile() : false,
      cacheStats: this.vulnerabilityTable ? this.vulnerabilityTable.getCacheStats() : null,
      chartStats: this.riskChart ? this.riskChart.getCacheStats() : null,
      aiStats: this.aiExplanation ? this.aiExplanation.getCacheStats() : null
    };
  }

  reset() {
    // Reset file upload
    if (this.fileUpload) {
      this.fileUpload.reset();
    }
    
    // Reset table
    if (this.vulnerabilityTable) {
      this.vulnerabilityTable.reset();
    }
    
    // Reset charts
    if (this.riskChart) {
      this.riskChart.render([]);
    }
    
    // Clear AI explanations
    if (this.aiExplanation) {
      this.aiExplanation.clearCache();
    }
    
    // Clear status
    this.showStatus('', 'info');
    
    // Hide results section
    const resultsSection = DOMUtils.$('resultsSection');
    if (resultsSection) {
      DOMUtils.hide(resultsSection);
    }
    
    // Enable analysis buttons
    this.enableAnalysisButtons();
  }

  destroy() {
    // Stop auto refresh
    this.stopAutoRefresh();
    
    // Destroy components
    if (this.fileUpload) {
      this.fileUpload.destroy();
    }
    
    if (this.vulnerabilityTable) {
      this.vulnerabilityTable.destroy();
    }
    
    if (this.riskChart) {
      this.riskChart.destroy();
    }
    
    if (this.aiExplanation) {
      this.aiExplanation.destroy();
    }
    
    // Clear timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.container = null;
    this.fileUpload = null;
    this.vulnerabilityTable = null;
    this.riskChart = null;
    this.aiExplanation = null;
  }
}

// Auto-initialize when DOM is ready
DOMUtils.ready(() => {
  window.dashboardComponent = new DashboardComponent({
    autoRefresh: false, // Disabled by default
    onAnalysisComplete: (result) => {
      console.log('Analysis completed:', result);
    },
    onError: (error) => {
      console.error('Dashboard error:', error);
    }
  });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardComponent;
}
