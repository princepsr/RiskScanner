// Risk Scanner - API Client

class RiskScannerAPI {
  constructor(config = window.RiskScannerConfig) {
    this.config = config;
    this.baseURL = config.api.baseURL;
    this.timeout = config.api.timeout;
    this.retries = config.api.retries;
    this.retryDelay = config.api.retryDelay;
  }

  /**
   * Generic API request method with retry logic
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    let lastError;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        if (this.config.development.logAPICalls) {
          console.log(`API Request: ${config.method || 'GET'} ${url}`, config.body);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const data = await response.json();
          
          if (this.config.development.logAPICalls) {
            console.log(`API Response: ${url}`, data);
          }
          
          return data;
        } else {
          return await response.text();
        }

      } catch (error) {
        lastError = error;
        
        if (attempt < this.retries && this.shouldRetry(error)) {
          if (this.config.development.debug) {
            console.warn(`API request failed, retrying (${attempt + 1}/${this.retries}):`, error.message);
          }
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Check if error should trigger a retry
   */
  shouldRetry(error) {
    // Don't retry on abort, client errors (4xx), or timeout
    if (error.name === 'AbortError') return false;
    if (error.message.includes('HTTP 4')) return false;
    if (error.message.includes('timeout')) return false;
    
    // Retry on network errors and server errors (5xx)
    return true;
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vulnerability Analysis Methods
   */
  async analyzeDependency(data) {
    return this.request(this.config.endpoints.analyzeSingle, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async analyzeBatchDependencies(data) {
    return this.request(this.config.endpoints.analyzeBatch, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async scanProject(projectPath, buildTool = 'auto') {
    const params = new URLSearchParams({
      projectPath: encodeURIComponent(projectPath),
      buildTool: buildTool
    });
    
    return this.request(`${this.config.endpoints.scanProject}?${params}`);
  }

  async analyzeProject(data) {
    return this.request(this.config.endpoints.analyzeProject, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCachedResults() {
    return this.request(this.config.endpoints.getCachedResults);
  }

  /**
   * AI Settings Methods
   */
  async getAISettings() {
    return this.request(this.config.endpoints.getAISettings);
  }

  async saveAISettings(settings) {
    return this.request(this.config.endpoints.saveAISettings, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async testAIConnection() {
    return this.request(this.config.endpoints.testAIConnection, {
      method: 'POST'
    });
  }

  /**
   * Vulnerability Management Methods
   */
  async suppressVulnerability(data) {
    return this.request(this.config.endpoints.suppressVulnerability, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async unsuppressVulnerability(findingId) {
    return this.request(`${this.config.endpoints.unsuppressVulnerability}/${findingId}`, {
      method: 'DELETE'
    });
  }

  async getSuppressionHistory() {
    return this.request(this.config.endpoints.getSuppressionHistory);
  }

  /**
   * Export Methods
   */
  async exportJSON(data) {
    return this.downloadFile(this.config.endpoints.exportJSON, data, 'risk-report.json');
  }

  async exportCSV(data) {
    return this.downloadFile(this.config.endpoints.exportCSV, data, 'risk-report.csv');
  }

  async exportPDF(data) {
    return this.downloadFile(this.config.endpoints.exportPDF, data, 'risk-report.pdf');
  }

  /**
   * Download file helper
   */
  async downloadFile(endpoint, data, filename) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error(`Failed to download ${filename}: ${error.message}`);
    }
  }

  /**
   * System Methods
   */
  async healthCheck() {
    return this.request(this.config.endpoints.health);
  }

  async getVersion() {
    return this.request(this.config.endpoints.version);
  }

  /**
   * File Upload Method
   */
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.buildTool) {
      formData.append('buildTool', options.buildTool);
    }
    if (options.analysisMode) {
      formData.append('analysisMode', options.analysisMode);
    }
    if (options.includeExplanations !== undefined) {
      formData.append('includeExplanations', options.includeExplanations);
    }
    if (options.forceRefresh !== undefined) {
      formData.append('forceRefresh', options.forceRefresh);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.upload.timeout);

    try {
      const response = await fetch(`${this.baseURL}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Batch file upload for multiple files
   */
  async uploadFiles(files, options = {}) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(files[i], options);
        results.push({ file: files[i].name, success: true, data: result });
      } catch (error) {
        results.push({ file: files[i].name, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Real-time updates (WebSocket or Server-Sent Events)
   */
  async subscribeToUpdates(callback) {
    try {
      const eventSource = new EventSource(`${this.baseURL}/api/updates`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(null, data);
        } catch (error) {
          callback(error, null);
        }
      };
      
      eventSource.onerror = (error) => {
        callback(error, null);
        eventSource.close();
      };
      
      return eventSource;
    } catch (error) {
      throw new Error(`Failed to subscribe to updates: ${error.message}`);
    }
  }

  /**
   * Cancel ongoing request
   */
  cancelRequest(controller) {
    if (controller) {
      controller.abort();
    }
  }

  /**
   * Create abort controller for cancellable requests
   */
  createAbortController() {
    return new AbortController();
  }

  /**
   * Validate API response
   */
  validateResponse(data, schema) {
    // Basic validation - can be extended with JSON schema validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: expected object');
    }
    
    if (schema && schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new Error(`Invalid response: missing required field '${field}'`);
        }
      }
    }
    
    return data;
  }

  /**
   * Cache management
   */
  getCacheKey(endpoint, params = {}) {
    const paramString = new URLSearchParams(params).toString();
    return `${endpoint}${paramString ? '?' + paramString : ''}`;
  }

  async getCachedData(cacheKey) {
    if (!this.config.cache.enabled) return null;
    
    try {
      const cached = localStorage.getItem(this.config.cache.storageKey);
      if (!cached) return null;
      
      const cache = JSON.parse(cached);
      const item = cache[cacheKey];
      
      if (!item) return null;
      
      // Check TTL
      if (Date.now() - item.timestamp > this.config.cache.ttl) {
        delete cache[cacheKey];
        localStorage.setItem(this.config.cache.storageKey, JSON.stringify(cache));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  setCachedData(cacheKey, data) {
    if (!this.config.cache.enabled) return;
    
    try {
      const cached = localStorage.getItem(this.config.cache.storageKey);
      const cache = cached ? JSON.parse(cached) : {};
      
      // Implement LRU eviction if cache is full
      const keys = Object.keys(cache);
      if (keys.length >= this.config.cache.maxSize) {
        const oldestKey = keys.reduce((oldest, key) => 
          cache[key].timestamp < cache[oldest].timestamp ? key : oldest
        );
        delete cache[oldestKey];
      }
      
      cache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.config.cache.storageKey, JSON.stringify(cache));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  clearCache() {
    if (!this.config.cache.enabled) return;
    
    try {
      localStorage.removeItem(this.config.cache.storageKey);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

// Create global API instance
window.riskScannerAPI = new RiskScannerAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RiskScannerAPI, riskScannerAPI: window.riskScannerAPI };
}
