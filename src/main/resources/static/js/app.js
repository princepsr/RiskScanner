// Risk Scanner - Main Application

class RiskScannerApp {
  constructor() {
    this.config = window.RiskScannerConfig;
    this.api = window.riskScannerAPI;
    this.currentView = 'dashboard';
    this.currentTheme = this.config.ui.theme;
    this.analysisData = null;
    this.eventListeners = new Map();
    
    this.init();
  }

  async init() {
    try {
      // Initialize theme
      this.initTheme();
      
      // Initialize navigation
      this.initNavigation();
      
      // Initialize components
      await this.initComponents();
      
      // Load initial data
      await this.loadInitialData();
      
      // Setup keyboard shortcuts
      this.initKeyboardShortcuts();
      
      // Setup error handling
      this.initErrorHandling();
      
      console.log('Risk Scanner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Risk Scanner:', error);
      this.showGlobalError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize theme system
   */
  initTheme() {
    const savedTheme = localStorage.getItem('riskscanner-theme') || this.currentTheme;
    
    if (savedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    } else {
      this.setTheme(savedTheme);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Theme toggle button
    const themeToggle = DOMUtils.$('themeToggle');
    if (themeToggle) {
      DOMUtils.on(themeToggle, 'click', () => this.toggleTheme());
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('riskscanner-theme', theme);
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  /**
   * Initialize navigation system
   */
  initNavigation() {
    const navLinks = DOMUtils.queryAll('.navbar__link');
    
    navLinks.forEach(link => {
      const viewName = link.getAttribute('data-view');
      if (viewName) {
        DOMUtils.on(link, 'click', (e) => {
          e.preventDefault();
          this.showView(viewName);
        });
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        this.showView(e.state.view, false);
      }
    });

    // Set initial view from URL or default
    const hashView = window.location.hash.slice(1);
    this.showView(hashView || 'dashboard', false);
  }

  showView(viewName, updateHistory = true) {
    // Hide all views
    DOMUtils.queryAll('.view').forEach(view => {
      DOMUtils.removeClass(view, 'view--active');
    });

    // Update navigation
    DOMUtils.queryAll('.navbar__link').forEach(link => {
      DOMUtils.removeClass(link, 'navbar__link--active');
    });

    // Show selected view
    const view = DOMUtils.$(viewName);
    if (view) {
      DOMUtils.addClass(view, 'view--active');
      
      // Update navigation active state
      const activeLink = DOMUtils.query(`.navbar__link[data-view="${viewName}"]`);
      if (activeLink) {
        DOMUtils.addClass(activeLink, 'navbar__link--active');
      }

      this.currentView = viewName;

      // Update browser history
      if (updateHistory) {
        history.pushState({ view: viewName }, '', `#${viewName}`);
      }

      // Trigger view-specific initialization
      this.onViewChange(viewName);
    }
  }

  onViewChange(viewName) {
    switch (viewName) {
      case 'dashboard':
        this.initDashboard();
        break;
      case 'settings':
        this.initSettings();
        break;
      case 'history':
        this.initHistory();
        break;
      case 'help':
        // Help view is static, no initialization needed
        break;
    }
  }

  /**
   * Initialize components
   */
  async initComponents() {
    // Initialize file upload
    if (window.FileUploadComponent) {
      this.fileUpload = new FileUploadComponent();
    }

    // Initialize vulnerability table
    if (window.VulnerabilityTableComponent) {
      this.vulnerabilityTable = new VulnerabilityTableComponent();
    }

    // Initialize risk charts
    if (window.RiskChartComponent) {
      this.riskChart = new RiskChartComponent();
    }

    // Initialize AI explanation
    if (window.AIExplanationComponent) {
      this.aiExplanation = new AIExplanationComponent();
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      // Check API health
      await this.api.healthCheck();
      
      // Load AI settings
      await this.loadAISettings();
      
      // Load cached results if available
      if (this.config.ui.autoRefresh) {
        await this.loadCachedResults();
      }
    } catch (error) {
      console.warn('Failed to load initial data:', error);
      // Don't show error to user on initial load, just log it
    }
  }

  /**
   * Initialize dashboard view
   */
  initDashboard() {
    // Initialize file upload if not already done
    if (!this.fileUpload && window.FileUploadComponent) {
      this.fileUpload = new FileUploadComponent();
    }

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
      DOMUtils.on(loadCachedBtn, 'click', () => this.loadCachedResults());
    }
  }

  /**
   * Initialize settings view
   */
  async initSettings() {
    await this.loadAISettings();

    // Setup AI settings form
    const saveBtn = DOMUtils.$('saveAiSettings');
    const testBtn = DOMUtils.$('testAiConnection');
    const loadBtn = DOMUtils.$('loadAiSettings');

    if (saveBtn) {
      DOMUtils.on(saveBtn, 'click', () => this.saveAISettings());
    }

    if (testBtn) {
      DOMUtils.on(testBtn, 'click', () => this.testAIConnection());
    }

    if (loadBtn) {
      DOMUtils.on(loadBtn, 'click', () => this.loadAISettings());
    }

    // Setup AI provider change handler
    const providerSelect = DOMUtils.$('aiProvider');
    if (providerSelect) {
      DOMUtils.on(providerSelect, 'change', () => this.handleProviderChange());
    }
  }

  /**
   * Initialize history view
   */
  async initHistory() {
    try {
      const history = await this.api.getSuppressionHistory();
      this.renderHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
      this.showViewError('history', 'Failed to load analysis history');
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  initKeyboardShortcuts() {
    if (!this.config.ui.enableKeyboardShortcuts) return;

    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '1':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.showView('dashboard');
          }
          break;
        case '2':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.showView('settings');
          }
          break;
        case '3':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.showView('history');
          }
          break;
        case 'h':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.showView('help');
          }
          break;
        case '/':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.focusSearch();
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.refreshCurrentView();
          }
          break;
      }
    });
  }

  /**
   * Initialize error handling
   */
  initErrorHandling() {
    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.handleGlobalError(e.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.handleGlobalError(e.reason);
    });
  }

  /**
   * Handle analysis
   */
  async handleAnalyze() {
    if (!this.fileUpload || !this.fileUpload.getFile()) {
      this.showViewError('dashboard', 'Please upload a build file first');
      return;
    }

    try {
      this.showLoading('Analyzing dependencies...');
      
      const file = this.fileUpload.getFile();
      const options = this.getAnalysisOptions();
      
      const result = await this.api.uploadFile(file, options);
      this.analysisData = result;
      
      this.renderResults(result);
      this.showSuccess('Analysis completed successfully');
      
      // Show results section
      const resultsSection = DOMUtils.$('resultsSection');
      if (resultsSection) {
        DOMUtils.show(resultsSection);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      this.showViewError('dashboard', `Analysis failed: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle scan only
   */
  async handleScan() {
    if (!this.fileUpload || !this.fileUpload.getFile()) {
      this.showViewError('dashboard', 'Please upload a build file first');
      return;
    }

    try {
      this.showLoading('Scanning dependencies...');
      
      const file = this.fileUpload.getFile();
      const result = await this.api.uploadFile(file, { 
        scanOnly: true,
        ...this.getAnalysisOptions()
      });
      
      this.renderScanResults(result);
      this.showSuccess('Scan completed successfully');
      
    } catch (error) {
      console.error('Scan failed:', error);
      this.showViewError('dashboard', `Scan failed: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Get analysis options from form
   */
  getAnalysisOptions() {
    const buildTool = DOMUtils.$('buildTool')?.value || 'auto';
    const analysisMode = DOMUtils.$('analysisMode')?.value || 'safe';
    const includeExplanations = DOMUtils.$('includeExplanations')?.checked ?? true;
    const forceRefresh = DOMUtils.$('forceRefresh')?.checked ?? false;

    return {
      buildTool,
      analysisMode,
      includeExplanations,
      forceRefresh
    };
  }

  /**
   * Load AI settings
   */
  async loadAISettings() {
    try {
      const settings = await this.api.getAISettings();
      this.populateAISettings(settings);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  }

  /**
   * Save AI settings
   */
  async saveAISettings() {
    try {
      this.showLoading('Saving AI settings...');
      
      const settings = this.collectAISettings();
      await this.api.saveAISettings(settings);
      
      this.showSuccess('AI settings saved successfully');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      this.showViewError('settings', `Failed to save settings: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Test AI connection
   */
  async testAIConnection() {
    try {
      this.showLoading('Testing AI connection...');
      
      await this.api.testAIConnection();
      this.showSuccess('AI connection test successful');
    } catch (error) {
      console.error('AI connection test failed:', error);
      this.showViewError('settings', `AI connection test failed: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle AI provider change
   */
  handleProviderChange() {
    const provider = DOMUtils.$('aiProvider')?.value;
    const modelInput = DOMUtils.$('aiModel');
    const ollamaSettings = DOMUtils.$('ollamaSettings');
    const azureSettings = DOMUtils.$('azureSettings');

    // Update model placeholder and example
    const modelExamples = {
      'openai': 'gpt-4o-mini',
      'claude': 'claude-3-5-haiku-20241022',
      'gemini': 'gemini-1.5-flash',
      'ollama': 'llama3.2',
      'azure-openai': 'gpt-4o'
    };

    if (modelInput && modelExamples[provider]) {
      modelInput.placeholder = modelExamples[provider];
      if (!modelInput.value) {
        modelInput.value = modelExamples[provider];
      }
    }

    // Show/hide provider-specific settings
    if (ollamaSettings) {
      DOMUtils.toggle(ollamaSettings, provider === 'ollama');
    }

    if (azureSettings) {
      DOMUtils.toggle(azureSettings, provider === 'azure-openai');
    }
  }

  /**
   * Collect AI settings from form
   */
  collectAISettings() {
    return {
      provider: DOMUtils.$('aiProvider')?.value || 'openai',
      model: DOMUtils.$('aiModel')?.value || '',
      apiKey: DOMUtils.$('apiKey')?.value || '',
      ollamaBaseUrl: DOMUtils.$('ollamaBaseUrl')?.value || 'http://localhost:11434',
      azureEndpoint: DOMUtils.$('azureEndpoint')?.value || ''
    };
  }

  /**
   * Populate AI settings form
   */
  populateAISettings(settings) {
    if (DOMUtils.$('aiProvider')) DOMUtils.$('aiProvider').value = settings.provider || 'openai';
    if (DOMUtils.$('aiModel')) DOMUtils.$('aiModel').value = settings.model || '';
    if (DOMUtils.$('apiKey')) DOMUtils.$('apiKey').value = settings.apiKey || '';
    if (DOMUtils.$('ollamaBaseUrl')) DOMUtils.$('ollamaBaseUrl').value = settings.ollamaBaseUrl || 'http://localhost:11434';
    if (DOMUtils.$('azureEndpoint')) DOMUtils.$('azureEndpoint').value = settings.azureEndpoint || '';

    this.handleProviderChange();
  }

  /**
   * Load cached results
   */
  async loadCachedResults() {
    try {
      this.showLoading('Loading cached results...');
      
      const results = await this.api.getCachedResults();
      this.renderResults(results);
      
      if (results && results.length > 0) {
        this.showSuccess(`Loaded ${results.length} cached results`);
        
        const resultsSection = DOMUtils.$('resultsSection');
        if (resultsSection) {
          DOMUtils.show(resultsSection);
        }
      } else {
        this.showInfo('No cached results found');
      }
    } catch (error) {
      console.error('Failed to load cached results:', error);
      this.showViewError('dashboard', `Failed to load cached results: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Render analysis results
   */
  renderResults(results) {
    if (this.vulnerabilityTable) {
      this.vulnerabilityTable.render(results);
    }

    if (this.riskChart) {
      this.riskChart.render(results);
    }

    this.renderResultsSummary(results);
  }

  /**
   * Render scan results
   */
  renderScanResults(results) {
    // Render as dependency list without vulnerabilities
    if (this.vulnerabilityTable) {
      this.vulnerabilityTable.renderScanResults(results);
    }
  }

  /**
   * Render results summary
   */
  renderResultsSummary(results) {
    const summaryContainer = DOMUtils.$('resultsSummary');
    if (!summaryContainer || !results) return;

    const summary = this.calculateSummary(results);
    
    summaryContainer.innerHTML = `
      <div class="summary-card summary-card--critical">
        <div class="summary-card__value">${summary.critical}</div>
        <div class="summary-card__label">Critical</div>
      </div>
      <div class="summary-card summary-card--high">
        <div class="summary-card__value">${summary.high}</div>
        <div class="summary-card__label">High</div>
      </div>
      <div class="summary-card summary-card--medium">
        <div class="summary-card__value">${summary.medium}</div>
        <div class="summary-card__label">Medium</div>
      </div>
      <div class="summary-card summary-card--low">
        <div class="summary-card__value">${summary.low}</div>
        <div class="summary-card__label">Low</div>
      </div>
    `;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(results) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    if (Array.isArray(results)) {
      results.forEach(result => {
        const severity = result.severity || result.rawSeverity || 'UNKNOWN';
        switch (severity.toUpperCase()) {
          case 'CRITICAL':
            summary.critical++;
            break;
          case 'HIGH':
            summary.high++;
            break;
          case 'MEDIUM':
            summary.medium++;
            break;
          case 'LOW':
            summary.low++;
            break;
        }
      });
    }

    return summary;
  }

  /**
   * Render history
   */
  renderHistory(history) {
    const historyList = DOMUtils.$('historyList');
    if (!historyList) return;

    if (!history || history.length === 0) {
      historyList.innerHTML = '<p class="text-muted">No analysis history found</p>';
      return;
    }

    historyList.innerHTML = history.map(item => `
      <div class="history-item">
        <div class="history-item__header">
          <h3 class="history-item__title">${item.dependency || 'Unknown'}</h3>
          <span class="history-item__date">${new Date(item.timestamp).toLocaleString()}</span>
        </div>
        <div class="history-item__stats">
          <div class="history-item__stat">
            <span class="history-item__stat-label">Risk Score:</span>
            <span class="history-item__stat-value">${item.riskScore || 'N/A'}</span>
          </div>
          <div class="history-item__stat">
            <span class="history-item__stat-label">Severity:</span>
            <span class="history-item__stat-value">${item.severity || 'N/A'}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * UI helper methods
   */
  showLoading(message = 'Loading...') {
    const overlay = DOMUtils.$('loadingOverlay');
    if (overlay) {
      const text = overlay.querySelector('.loading-spinner__text');
      if (text) {
        text.textContent = message;
      }
      DOMUtils.show(overlay);
    }
  }

  hideLoading() {
    const overlay = DOMUtils.$('loadingOverlay');
    if (overlay) {
      DOMUtils.hide(overlay);
    }
  }

  showSuccess(message) {
    this.showMessage('success', message);
  }

  showError(message) {
    this.showMessage('error', message);
  }

  showInfo(message) {
    this.showMessage('info', message);
  }

  showMessage(type, message) {
    const statusElement = DOMUtils.$(`${type}Status`);
    if (statusElement) {
      statusElement.textContent = message;
      DOMUtils.show(statusElement);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        DOMUtils.hide(statusElement);
      }, 5000);
    }

    // Also show as notification if enabled
    if (this.config.ui.enableNotifications && 'Notification' in window) {
      new Notification(`Risk Scanner - ${type.charAt(0).toUpperCase() + type.slice(1)}`, {
        body: message,
        icon: '/assets/icons/icon-192x192.png'
      });
    }
  }

  showViewError(viewName, message) {
    const view = DOMUtils.$(viewName);
    if (view) {
      this.showError(message);
    }
  }

  showGlobalError(message) {
    console.error('Global error:', message);
    
    // Create global error message
    const errorDiv = DOMUtils.createElement('div', {
      className: 'global-error',
      innerHTML: `
        <div class="global-error__content">
          <h3>Application Error</h3>
          <p>${message}</p>
          <button onclick="location.reload()">Reload Page</button>
        </div>
      `
    });
    
    document.body.appendChild(errorDiv);
  }

  focusSearch() {
    const searchInput = DOMUtils.$('tableSearch');
    if (searchInput) {
      DOMUtils.focus(searchInput);
    }
  }

  refreshCurrentView() {
    this.onViewChange(this.currentView);
  }

  handleGlobalError(error) {
    if (this.config.errors.logToConsole) {
      console.error('Global error handled:', error);
    }
    
    // Don't show global error for every little thing
    // Only show for critical errors
    if (error.name === 'ChunkLoadError' || error.message.includes('Failed to fetch')) {
      this.showGlobalError('A network error occurred. Please check your connection and refresh the page.');
    }
  }
}

// Initialize application when DOM is ready
DOMUtils.ready(() => {
  window.riskScannerApp = new RiskScannerApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RiskScannerApp;
}
