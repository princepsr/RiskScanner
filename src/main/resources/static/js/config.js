// Risk Scanner - Application Configuration

window.RiskScannerConfig = {
  // API Configuration
  api: {
    baseURL: '',
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  },

  // API Endpoints
  endpoints: {
    // Vulnerability Analysis
    analyzeSingle: '/api/vulnerabilities/analyze',
    analyzeBatch: '/api/vulnerabilities/analyze/batch',
    scanProject: '/api/project/scan',
    analyzeProject: '/api/project/analyze',
    getCachedResults: '/api/dashboard/cached-results',
    
    // AI Settings
    getAISettings: '/api/ai/settings',
    saveAISettings: '/api/ai/settings',
    testAIConnection: '/api/ai/test-connection',
    
    // Vulnerability Management
    suppressVulnerability: '/api/vulnerabilities/suppress',
    unsuppressVulnerability: '/api/vulnerabilities/unsuppress',
    getSuppressionHistory: '/api/vulnerabilities/suppressions/history',
    
    // Export
    exportJSON: '/api/export/json',
    exportCSV: '/api/export/csv',
    exportPDF: '/api/export/pdf',
    
    // System
    health: '/api/health',
    version: '/api/version'
  },

  // UI Configuration
  ui: {
    theme: 'dark', // 'light' | 'dark' | 'auto'
    itemsPerPage: 25,
    maxItemsPerPage: 100,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
    enableNotifications: true,
    enableAnimations: true,
    enableKeyboardShortcuts: true
  },

  // Analysis Configuration
  analysis: {
    defaultMode: 'safe', // 'safe' | 'full'
    confidenceThreshold: 'medium', // 'low' | 'medium' | 'high'
    includeExplanations: true,
    forceRefresh: false,
    enableProgressTracking: true
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.xml', '.gradle', '.kts'],
    allowedMimeTypes: ['text/xml', 'application/xml', 'text/plain'],
    chunkSize: 1024 * 1024, // 1MB chunks for large files
    timeout: 60000 // 1 minute
  },

  // Chart Configuration
  charts: {
    defaultType: 'bar',
    colors: {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d',
      info: '#0891b2',
      unknown: '#64748b'
    },
    animationDuration: 750,
    responsive: true,
    maintainAspectRatio: false
  },

  // Cache Configuration
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100, // Maximum cached items
    storageKey: 'riskscanner-cache'
  },

  // Error Handling
  errors: {
    showNotifications: true,
    logToConsole: true,
    sendToServer: false,
    maxRetries: 3,
    retryDelay: 2000
  },

  // Performance Monitoring
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10% sampling
    maxSamples: 1000,
    storageKey: 'riskscanner-performance'
  },

  // Feature Flags
  features: {
    aiExplanations: true,
    riskCharts: true,
    exportPDF: true,
    realTimeUpdates: true,
    offlineMode: false,
    advancedFilters: true,
    batchAnalysis: true,
    historyTracking: true
  },

  // Development Configuration
  development: {
    debug: false,
    mockAPI: false,
    logAPICalls: false,
    showPerformanceMetrics: false,
    enableHotReload: false
  }
};

// Environment-specific configuration
(function() {
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('dev');

  if (isDevelopment) {
    window.RiskScannerConfig.development.debug = true;
    window.RiskScannerConfig.development.logAPICalls = true;
    window.RiskScannerConfig.ui.enableAnimations = true;
    window.RiskScannerConfig.errors.logToConsole = true;
  }

  // Override with environment variables if available
  if (window.RISK_SCANNER_CONFIG) {
    Object.assign(window.RiskScannerConfig, window.RISK_SCANNER_CONFIG);
  }
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.RiskScannerConfig;
}
