// Main application module
const RiskScanner = (() => {
  // DOM Utilities
  const DOM = {
    get: (id) => document.getElementById(id),
    create: (tag, attrs = {}) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'textContent') {
          el.textContent = value;
        } else if (key === 'innerHTML') {
          el.innerHTML = value;
        } else if (key === 'classList') {
          el.classList.add(...value.split(' '));
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            el.dataset[dataKey] = dataValue;
          });
        } else {
          el.setAttribute(key, value);
        }
      });
      return el;
    },
    show: (el) => { if (el) el.hidden = false; },
    hide: (el) => { if (el) el.hidden = true; },
    toggle: (el, show) => { if (el) el.hidden = !show; },
    setText: (el, text) => { if (el) el.textContent = text; },
    setHTML: (el, html) => { if (el) el.innerHTML = html; },
    on: (el, event, handler) => el?.addEventListener(event, handler),
    off: (el, event, handler) => el?.removeEventListener(event, handler)
  };

  // API Configuration
  const API = {
    BASE_URL: '/api',
    ENDPOINTS: {
      PROJECT_ANALYZE: '/project/analyze'
    },
    HEADERS: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    async request(endpoint, options = {}) {
      const url = `${this.BASE_URL}${endpoint}`;
      const config = {
        headers: { ...this.HEADERS, ...options.headers },
        ...options
      };

      try {
        const response = await fetch(url, config);
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          error.response = response;
          throw error;
        }
        return await response.json();
      } catch (error) {
        console.error('API Request failed:', error);
        throw error;
      }
    }
  };

  // Application State
  const State = {
    isScanning: false,
    error: null,
    settings: {
      buildTool: 'maven',
      aiEnabled: false,
      aiProvider: null,
      aiApiKey: null
    },
    setScanning(scanning) {
      this.isScanning = scanning;
      DOM.toggle(DOM.get('analyzeDependencies'), !scanning);
      DOM.toggle(DOM.get('loadingOverlay'), scanning);
    },
    setError(error) {
      this.error = error;
      if (error) {
        UI.showError(error.message || 'An unknown error occurred');
      }
    },
    updateSettings(updates) {
      this.settings = { ...this.settings, ...updates };
      this.saveSettings();
    },
    saveSettings() {
      try {
        localStorage.setItem('riskScannerSettings', JSON.stringify(this.settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    },
    loadSettings() {
      try {
        const saved = localStorage.getItem('riskScannerSettings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  };

  // UI Components
  const UI = {
    init() {
      this.bindEvents();
      this.updateUI();
    },
    
    bindEvents() {
      // Build tool selection
      const buildToolEls = document.querySelectorAll('input[name="buildTool"]');
      buildToolEls.forEach((el) => {
        DOM.on(el, 'change', (e) => {
          State.updateSettings({ buildTool: e.target.value });
          this.updateUI();
        });
      });
      
      // AI toggle
      DOM.on(DOM.get('enableAI'), 'change', (e) => {
        State.updateSettings({ aiEnabled: e.target.checked });
        this.updateUI();
      });
      
      // Analyze button
      DOM.on(DOM.get('analyzeDependencies'), 'click', () => Scanner.startScan());
      
      // Build file content changes
      const ta = DOM.get('buildFileContent');
      if (ta) {
        DOM.on(ta, 'input', () => {
          this.updateCharCount();
          this.updateAnalyzeButton();
        });
      }
      
      // Clear button
      DOM.on(DOM.get('clearBuildFile'), 'click', () => {
        const ta = DOM.get('buildFileContent');
        if (ta) {
          ta.value = '';
          ta.dispatchEvent(new Event('input'));
        }
      });
      
      // Modal close
      DOM.on(DOM.get('closeDetails'), 'click', () => DOM.hide(DOM.get('detailsModal')));
      DOM.on(DOM.get('detailsModal'), 'click', (e) => {
        if (e.target.classList.contains('modal__backdrop')) {
          DOM.hide(DOM.get('detailsModal'));
        }
      });
    },
    
    updateUI() {
      const { buildTool, aiEnabled } = State.settings;
      
      // Update build tool UI
      DOM.toggle(DOM.get('gradleWarning'), buildTool === 'gradle');
      DOM.setText(DOM.get('confidenceBadge'), 
        `CONFIDENCE: ${buildTool === 'gradle' ? 'MEDIUM' : 'HIGH'}`);
      
      // Update AI settings
      DOM.toggle(DOM.get('aiSettings'), aiEnabled);
      
      // Update build file placeholder
      this.updateBuildFilePlaceholder();
    },
    
    updateBuildFilePlaceholder() {
      const ta = DOM.get('buildFileContent');
      if (!ta) return;

      ta.placeholder = "e.g. C:/path/to/project OR C:/path/to/project/pom.xml";
    },
    
    updateCharCount() {
      const ta = DOM.get('buildFileContent');
      const countEl = DOM.get('buildFileCharCount');
      if (!ta || !countEl) return;
      
      const len = ta.value.length;
      DOM.setText(countEl, `${len} ${len === 1 ? 'character' : 'characters'}`);
    },
    
    updateAnalyzeButton() {
      const btn = DOM.get('analyzeDependencies');
      const ta = DOM.get('buildFileContent');
      if (!btn || !ta) return;
      
      btn.disabled = !ta.value.trim() || State.isScanning;
    },
    
    showError(message) {
      const banner = DOM.create('div', {
        class: 'alert alert--error',
        innerHTML: `
          <svg class="alert__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div class="alert__content">${message}</div>
          <button class="alert__close" aria-label="Dismiss">&times;</button>
        `
      });
      
      // Add close button handler
      const closeBtn = banner.querySelector('.alert__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          banner.remove();
        });
      }
      
      // Insert at the top of the results panel
      const resultsPanel = document.querySelector('.panel--right .panel__body');
      if (resultsPanel?.firstChild) {
        resultsPanel.insertBefore(banner, resultsPanel.firstChild);
        
        // Auto-remove after 10 seconds
        setTimeout(() => banner.remove(), 10000);
      }
    },
    
    showLoading(show, message = 'Analyzing...', progress = 0) {
      State.setScanning(show);
      
      const overlay = DOM.get('loadingOverlay');
      const textEl = DOM.get('loadingText');
      const progressEl = DOM.get('loadingProgress');
      
      if (show) {
        DOM.setText(textEl, message);
        if (progressEl) {
          progressEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
          progressEl.hidden = progress === 0;
        }
        DOM.show(overlay);
      } else {
        DOM.hide(overlay);
      }
    },
    
    updateResults(findings = []) {
      const hasFindings = Array.isArray(findings) && findings.length > 0;
      
      // Update summary
      const summary = this.computeSummary(findings);
      this.updateSummary(summary);
      
      // Render findings
      this.renderFindings(findings);

      // Toggle empty vs content
      DOM.toggle(DOM.get('overviewEmpty'), !hasFindings);
      DOM.toggle(DOM.get('overviewContent'), hasFindings);
      
      // Findings count
      const countEl = DOM.get('findingsCount');
      if (countEl) {
        countEl.textContent = `${hasFindings ? findings.length : 0} findings`;
      }
    },
    
    clearResults() {
      const tbody = DOM.get('resultsBody');
      if (tbody) tbody.innerHTML = '';
      
      this.updateSummary({ critical: 0, high: 0, medium: 0, low: 0 });

      DOM.toggle(DOM.get('overviewEmpty'), true);
      DOM.toggle(DOM.get('overviewContent'), false);

      const countEl = DOM.get('findingsCount');
      if (countEl) countEl.textContent = '0 findings';
    },
    
    updateSummary(summary) {
      const { critical = 0, high = 0, medium = 0, low = 0 } = summary;

      const total = critical + high + medium + low;

      DOM.setText(DOM.get('kpiCritical'), critical);
      DOM.setText(DOM.get('kpiHigh'), high);
      DOM.setText(DOM.get('kpiMedium'), medium);
      DOM.setText(DOM.get('kpiLow'), low);
      DOM.setText(DOM.get('kpiTotalDependencies'), total);
      DOM.setText(DOM.get('kpiVulnsFound'), total);
      DOM.setText(DOM.get('kpiOverallRisk'), total === 0 ? 0 : Math.round((high * 3 + medium * 2 + low) / total));
      
      // Update overall status
      const statusEl = DOM.get('appStatus');
      
      if (total === 0) {
        statusEl.className = 'status-chip status-chip--success';
        statusEl.textContent = 'No Issues';
      } else if (critical > 0) {
        statusEl.className = 'status-chip status-chip--critical';
        statusEl.textContent = 'Critical Issues';
      } else if (high > 0) {
        statusEl.className = 'status-chip status-chip--high';
        statusEl.textContent = 'High Risk';
      } else if (medium > 0) {
        statusEl.className = 'status-chip status-chip--medium';
        statusEl.textContent = 'Medium Risk';
      } else {
        statusEl.className = 'status-chip status-chip--low';
        statusEl.textContent = 'Low Risk';
      }
    },
    
    computeSummary(findings) {
      return findings.reduce((acc, finding) => {
        const s = String(finding.severity || '').toUpperCase();
        if (s === 'CRITICAL') acc.critical++;
        else if (s === 'HIGH') acc.high++;
        else if (s === 'MEDIUM') acc.medium++;
        else if (s === 'LOW') acc.low++;
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0 });
    },
    
    renderFindings(findings) {
      const tbody = DOM.get('resultsBody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      findings.forEach(finding => {
        const row = this.createFindingRow(finding);
        tbody.appendChild(row);
      });
    },
    
    createFindingRow(finding) {
      const row = document.createElement('tr');
      
      // Add click handler for details
      row.addEventListener('click', () => this.showFindingDetails(finding));
      row.style.cursor = 'pointer';
      
      // Add severity class for row highlighting
      row.className = `finding-row severity-${(finding.severity || '').toLowerCase()}`;
      
      // Create cells
      const cells = [
        this.createCell(finding.dependency || '--', 'dependency'),
        this.createSeverityCell(finding.severity),
        this.createCell(finding.id || '--', 'id'),
        this.createConfidenceCell(finding.confidence),
        this.createDirectnessCell(finding.directness),
        this.createActionCell()
      ];
      
      cells.forEach(cell => row.appendChild(cell));
      return row;
    },
    
    createCell(content, className = '') {
      const cell = document.createElement('td');
      if (className) cell.className = className;
      cell.textContent = content;
      return cell;
    },
    
    createSeverityCell(severity) {
      const cell = document.createElement('td');
      const severityText = String(severity || 'UNKNOWN').toUpperCase();
      const severityClass = `severity severity--${severityText.toLowerCase()}`;
      
      const badge = document.createElement('span');
      badge.className = severityClass;
      badge.textContent = severityText;
      
      cell.appendChild(badge);
      return cell;
    },
    
    createConfidenceCell(confidence) {
      const cell = document.createElement('td');
      const confidenceText = String(confidence || 'MEDIUM').toUpperCase();
      const confidenceClass = `confidence confidence--${confidenceText.toLowerCase()}`;
      
      const badge = document.createElement('span');
      badge.className = confidenceClass;
      badge.textContent = confidenceText;
      
      cell.appendChild(badge);
      return cell;
    },
    
    createDirectnessCell(directness) {
      const cell = document.createElement('td');
      const isDirect = directness === 'direct';
      const chipClass = isDirect ? 'chip chip--direct' : 'chip chip--transitive';
      const chipText = isDirect ? 'Direct' : 'Transitive';
      
      const chip = document.createElement('span');
      chip.className = chipClass;
      chip.textContent = chipText;
      
      cell.appendChild(chip);
      return cell;
    },
    
    createActionCell() {
      const cell = document.createElement('td');
      const btn = document.createElement('button');
      
      btn.type = 'button';
      btn.className = 'btn btn--link';
      btn.textContent = 'View';
      
      cell.appendChild(btn);
      return cell;
    },
    
    showFindingDetails(finding) {
      const modal = DOM.get('detailsModal');
      if (!modal) return;
      
      // Update modal content
      DOM.setText(DOM.get('detailsDependency'), finding.dependency || '--');
      DOM.setText(DOM.get('detailsId'), finding.id || '--');
      DOM.setText(DOM.get('detailsSeverity'), String(finding.severity || '--').toUpperCase());
      DOM.setText(DOM.get('detailsConfidence'), `Confidence: ${String(finding.confidence || '--').toUpperCase()}`);
      DOM.setText(DOM.get('detailsDirectness'), finding.directness || '--');
      DOM.setText(DOM.get('detailsSource'), `Source: ${finding.source || '--'}`);
      DOM.setText(DOM.get('detailsDescription'), finding.description || '--');
      DOM.setText(DOM.get('detailsAffected'), finding.affectedVersions || '--');
      DOM.setText(DOM.get('detailsPath'), finding.dependencyPath || '--');
      DOM.setText(DOM.get('detailsExplanation'), finding.explanationText || '--');
      
      // Show the modal
      DOM.show(modal);
    }
  };
  
  // Scan Service
  const Scanner = {
    async startScan() {
      if (State.isScanning) return;
      
      const projectPath = DOM.get('buildFileContent')?.value.trim() || '';
      
      // Validate input
      if (!projectPath) {
        UI.showError('Please provide a project path (folder or build file path) to analyze');
        return;
      }
      
      try {
        // Update UI
        State.setScanning(true);
        UI.showLoading(true, 'Analyzing project...');
        UI.clearResults();

        const response = await API.request(API.ENDPOINTS.PROJECT_ANALYZE, {
          method: 'POST',
          body: JSON.stringify({ projectPath, forceRefresh: true })
        });

        const findings = this.mapProjectResultsToFindings(response?.results || []);
        UI.updateResults(findings);
        
      } catch (error) {
        State.setError(error);
      } finally {
        State.setScanning(false);
        UI.showLoading(false);
      }
    },

    mapProjectResultsToFindings(results) {
      return (results || []).map((r, idx) => {
        const dependency = [r.groupId, r.artifactId, r.version].filter(Boolean).join(':');

        const riskLevel = String(r.riskLevel || 'UNKNOWN').toUpperCase();
        const severity = (riskLevel === 'HIGH' || riskLevel === 'MEDIUM' || riskLevel === 'LOW')
          ? riskLevel
          : 'LOW';

        return {
          _id: `dep-${idx}`,
          dependency: dependency || '--',
          severity,
          id: r.riskScore != null ? String(r.riskScore) : '--',
          confidence: 'HIGH',
          directness: 'direct',
          source: r.provider ? `${r.provider}${r.model ? `/${r.model}` : ''}` : '--',
          description: r.explanation || '--',
          affectedVersions: Array.isArray(r.recommendations) && r.recommendations.length
            ? r.recommendations.join('\n')
            : '--',
          dependencyPath: '--',
          explanationType: 'static',
          explanationText: r.explanation || '--'
        };
      });
    }
  };
  
  // Initialize the application
  return {
    init() {
      // Load saved settings
      State.loadSettings();
      
      // Initialize UI
      UI.init();
      
      // Set initial UI state
      UI.updateUI();
      UI.updateCharCount();
      UI.updateAnalyzeButton();
      
      // Show welcome message
      console.log('Risk Scanner initialized');
    }
  };
})();

// Start the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  RiskScanner.init();
});
