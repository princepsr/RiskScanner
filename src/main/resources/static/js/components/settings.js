// Risk Scanner - Settings Component

class SettingsComponent {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'settings',
      onSettingsUpdate: options.onSettingsUpdate || null,
      onError: options.onError || null,
      ...options
    };
    
    this.container = null;
    this.aiSettings = null;
    this.exportSettings = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.loadCurrentSettings();
    this.setupEventListeners();
  }

  setupElements() {
    this.container = DOMUtils.$(this.options.containerId);
    if (!this.container) {
      console.error(`Settings container not found: ${this.options.containerId}`);
      return;
    }
    
    this.createSettingsSections();
  }

  createSettingsSections() {
    this.container.innerHTML = `
      <div class="settings-grid">
        <section class="card" id="aiProviderSection">
          <h2 class="card__title">AI Provider Configuration</h2>
          <div class="form-group">
            <label class="form-label">AI Provider</label>
            <select class="form-select" id="aiProvider">
              <option value="openai">OpenAI</option>
              <option value="claude">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="azure-openai">Azure OpenAI</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Model</label>
            <input type="text" class="form-input" id="aiModel" placeholder="e.g., gpt-4o-mini">
          </div>
          <div class="form-group">
            <label class="form-label">API Key</label>
            <div class="input-group">
              <input type="password" class="form-input" id="apiKey" placeholder="Enter your API key">
              <button type="button" class="btn btn--outline btn--small" id="toggleApiKey">
                <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="form-group" id="ollamaSettings" style="display: none;">
            <label class="form-label">Ollama Base URL</label>
            <input type="url" class="form-input" id="ollamaBaseUrl" placeholder="http://localhost:11434">
          </div>
          <div class="form-group" id="azureSettings" style="display: none;">
            <label class="form-label">Azure Endpoint</label>
            <input type="url" class="form-input" id="azureEndpoint" placeholder="https://your-resource.openai.azure.com">
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--primary" id="testConnection">Test Connection</button>
            <button type="button" class="btn btn--secondary" id="saveAISettings">Save Settings</button>
          </div>
        </section>

        <section class="card" id="analysisOptionsSection">
          <h2 class="card__title">Analysis Options</h2>
          <div class="form-group">
            <label class="form-label">Default Build Tool</label>
            <select class="form-select" id="defaultBuildTool">
              <option value="auto">Auto-detect</option>
              <option value="maven">Maven</option>
              <option value="gradle">Gradle</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Default Analysis Mode</label>
            <select class="form-select" id="defaultAnalysisMode">
              <option value="safe">Safe Mode</option>
              <option value="full">Full Mode</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="includeExplanations" checked>
              <span class="checkbox-text">Include AI explanations by default</span>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="autoRefresh">
              <span class="checkbox-text">Auto-refresh results every 30 seconds</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="saveAnalysisSettings">Save Settings</button>
          </div>
        </section>

        <section class="card" id="exportOptionsSection">
          <h2 class="card__title">Export Options</h2>
          <div class="form-group">
            <label class="form-label">Default Export Format</label>
            <select class="form-select" id="defaultExportFormat">
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="includeTimestamps" checked>
              <span class="checkbox-text">Include timestamps in filenames</span>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="includeMetadata" checked>
              <span class="checkbox-text">Include metadata in exports</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="saveExportSettings">Save Settings</button>
          </div>
        </section>
      </div>
    `;
  }

  loadCurrentSettings() {
    this.loadAISettings();
    this.loadAnalysisSettings();
    this.loadExportSettings();
  }

  loadAISettings() {
    // Load AI settings from API or localStorage
    const savedSettings = this.getSavedAISettings();
    
    if (savedSettings) {
      const providerSelect = DOMUtils.$('aiProvider');
      const modelInput = DOMUtils.$('aiModel');
      const apiKeyInput = DOMUtils.$('apiKey');
      
      if (providerSelect) providerSelect.value = savedSettings.provider || 'openai';
      if (modelInput) modelInput.value = savedSettings.model || '';
      if (apiKeyInput) apiKeyInput.value = savedSettings.apiKey || '';
      
      // Show provider-specific settings
      this.updateProviderSpecificSettings(savedSettings.provider);
    }
  }

  loadAnalysisSettings() {
    const savedSettings = this.getSavedAnalysisSettings();
    
    if (savedSettings) {
      const buildToolSelect = DOMUtils.$('defaultBuildTool');
      const analysisModeSelect = DOMUtils.$('defaultAnalysisMode');
      const includeExplanationsCheckbox = DOMUtils.$('includeExplanations');
      const autoRefreshCheckbox = DOMUtils.$('autoRefresh');
      
      if (buildToolSelect) buildToolSelect.value = savedSettings.buildTool || 'auto';
      if (analysisModeSelect) analysisModeSelect.value = savedSettings.analysisMode || 'safe';
      if (includeExplanationsCheckbox) includeExplanationsCheckbox.checked = savedSettings.includeExplanations !== false;
      if (autoRefreshCheckbox) autoRefreshCheckbox.checked = savedSettings.autoRefresh || false;
    }
  }

  loadExportSettings() {
    const savedSettings = this.getSavedExportSettings();
    
    if (savedSettings) {
      const formatSelect = DOMUtils.$('defaultExportFormat');
      const includeTimestampsCheckbox = DOMUtils.$('includeTimestamps');
      const includeMetadataCheckbox = DOMUtils.$('includeMetadata');
      
      if (formatSelect) formatSelect.value = savedSettings.format || 'json';
      if (includeTimestampsCheckbox) includeTimestampsCheckbox.checked = savedSettings.includeTimestamps !== false;
      if (includeMetadataCheckbox) includeMetadataCheckbox.checked = savedSettings.includeMetadata !== false;
    }
  }

  setupEventListeners() {
    this.setupAIProviderListeners();
    this.setupAnalysisListeners();
    this.setupExportListeners();
  }

  setupAIProviderListeners() {
    const providerSelect = DOMUtils.$('aiProvider');
    const toggleKeyBtn = DOMUtils.$('toggleApiKey');
    const testConnectionBtn = DOMUtils.$('testConnection');
    const saveAIBtn = DOMUtils.$('saveAISettings');
    
    if (providerSelect) {
      DOMUtils.on(providerSelect, 'change', (e) => {
        this.updateProviderSpecificSettings(e.target.value);
      });
    }
    
    if (toggleKeyBtn) {
      DOMUtils.on(toggleKeyBtn, 'click', () => {
        this.toggleApiKeyVisibility();
      });
    }
    
    if (testConnectionBtn) {
      DOMUtils.on(testConnectionBtn, 'click', () => {
        this.testConnection();
      });
    }
    
    if (saveAIBtn) {
      DOMUtils.on(saveAIBtn, 'click', () => {
        this.saveAISettings();
      });
    }
  }

  setupAnalysisListeners() {
    const saveAnalysisBtn = DOMUtils.$('saveAnalysisSettings');
    
    if (saveAnalysisBtn) {
      DOMUtils.on(saveAnalysisBtn, 'click', () => {
        this.saveAnalysisSettings();
      });
    }
  }

  setupExportListeners() {
    const saveExportBtn = DOMUtils.$('saveExportSettings');
    
    if (saveExportBtn) {
      DOMUtils.on(saveExportBtn, 'click', () => {
        this.saveExportSettings();
      });
    }
  }

  updateProviderSpecificSettings(provider) {
    const ollamaSettings = DOMUtils.$('ollamaSettings');
    const azureSettings = DOMUtils.$('azureSettings');
    
    // Hide all provider-specific settings
    if (ollamaSettings) ollamaSettings.style.display = 'none';
    if (azureSettings) azureSettings.style.display = 'none';
    
    // Show relevant settings
    if (provider === 'ollama' && ollamaSettings) {
      ollamaSettings.style.display = 'block';
    } else if (provider === 'azure-openai' && azureSettings) {
      azureSettings.style.display = 'block';
    }
    
    // Update model placeholder
    const modelInput = DOMUtils.$('aiModel');
    if (modelInput) {
      modelInput.placeholder = this.getModelPlaceholder(provider);
    }
  }

  getModelPlaceholder(provider) {
    const placeholders = {
      'openai': 'e.g., gpt-4o-mini',
      'claude': 'e.g., claude-3-haiku-20240307',
      'gemini': 'e.g., gemini-1.5-flash',
      'ollama': 'e.g., llama3:8b',
      'azure-openai': 'e.g., gpt-4o-mini'
    };
    
    return placeholders[provider] || 'Enter model name';
  }

  toggleApiKeyVisibility() {
    const apiKeyInput = DOMUtils.$('apiKey');
    const toggleBtn = DOMUtils.$('toggleApiKey');
    
    if (apiKeyInput && toggleBtn) {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      
      // Update button icon
      toggleBtn.innerHTML = isPassword ? 
        `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>` :
        `<svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`;
    }
  }

  async testConnection() {
    const testBtn = DOMUtils.$('testConnection');
    const provider = DOMUtils.$('aiProvider')?.value;
    const model = DOMUtils.$('aiModel')?.value;
    const apiKey = DOMUtils.$('apiKey')?.value;
    
    if (!provider || !model) {
      this.showError('Please select a provider and enter a model name');
      return;
    }
    
    // Disable button and show loading
    if (testBtn) {
      testBtn.disabled = true;
      testBtn.textContent = 'Testing...';
    }
    
    try {
      // Call API to test connection
      const response = await this.callTestConnectionAPI(provider, model, apiKey);
      
      if (response.success) {
        this.showSuccess('Connection test successful!');
      } else {
        this.showError(`Connection test failed: ${response.error}`);
      }
    } catch (error) {
      this.showError(`Connection test failed: ${error.message}`);
    } finally {
      // Re-enable button
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';
      }
    }
  }

  async callTestConnectionAPI(provider, model, apiKey) {
    // This would integrate with the actual API
    // For now, return a mock response
    return {
      success: true,
      message: 'Connection successful'
    };
  }

  saveAISettings() {
    const settings = {
      provider: DOMUtils.$('aiProvider')?.value || 'openai',
      model: DOMUtils.$('aiModel')?.value || '',
      apiKey: DOMUtils.$('apiKey')?.value || '',
      ollamaBaseUrl: DOMUtils.$('ollamaBaseUrl')?.value || '',
      azureEndpoint: DOMUtils.$('azureEndpoint')?.value || ''
    };
    
    this.saveSettingsToStorage('aiSettings', settings);
    this.showSuccess('AI settings saved successfully!');
    
    if (this.options.onSettingsUpdate) {
      this.options.onSettingsUpdate('ai', settings);
    }
  }

  saveAnalysisSettings() {
    const settings = {
      buildTool: DOMUtils.$('defaultBuildTool')?.value || 'auto',
      analysisMode: DOMUtils.$('defaultAnalysisMode')?.value || 'safe',
      includeExplanations: DOMUtils.$('includeExplanations')?.checked || false,
      autoRefresh: DOMUtils.$('autoRefresh')?.checked || false
    };
    
    this.saveSettingsToStorage('analysisSettings', settings);
    this.showSuccess('Analysis settings saved successfully!');
    
    if (this.options.onSettingsUpdate) {
      this.options.onSettingsUpdate('analysis', settings);
    }
  }

  saveExportSettings() {
    const settings = {
      format: DOMUtils.$('defaultExportFormat')?.value || 'json',
      includeTimestamps: DOMUtils.$('includeTimestamps')?.checked || false,
      includeMetadata: DOMUtils.$('includeMetadata')?.checked || false
    };
    
    this.saveSettingsToStorage('exportSettings', settings);
    this.showSuccess('Export settings saved successfully!');
    
    if (this.options.onSettingsUpdate) {
      this.options.onSettingsUpdate('export', settings);
    }
  }

  saveSettingsToStorage(key, settings) {
    try {
      localStorage.setItem(`riskScanner_${key}`, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  getSavedAISettings() {
    try {
      const saved = localStorage.getItem('riskScanner_aiSettings');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      return null;
    }
  }

  getSavedAnalysisSettings() {
    try {
      const saved = localStorage.getItem('riskScanner_analysisSettings');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load analysis settings:', error);
      return null;
    }
  }

  getSavedExportSettings() {
    try {
      const saved = localStorage.getItem('riskScanner_exportSettings');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load export settings:', error);
      return null;
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
    let statusElement = DOMUtils.$('settingsStatus');
    
    if (!statusElement) {
      statusElement = DOMUtils.createElement('div', {
        id: 'settingsStatus',
        className: 'status-message'
      });
      
      const firstSection = this.container.querySelector('.card');
      if (firstSection) {
        DOMUtils.prepend(firstSection, statusElement);
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
    // Clean up event listeners
    this.container = null;
    this.aiSettings = null;
    this.exportSettings = null;
  }
}

// Auto-initialize when DOM is ready
DOMUtils.ready(() => {
  window.settingsComponent = new SettingsComponent({
    onSettingsUpdate: (type, settings) => {
      console.log('Settings updated:', type, settings);
    },
    onError: (error) => {
      console.error('Settings error:', error);
    }
  });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsComponent;
}
