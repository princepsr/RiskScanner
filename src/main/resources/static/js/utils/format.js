// Risk Scanner - Format Utilities

window.FormatUtils = {
  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format date in user-friendly format
   */
  formatDate(date, includeTime = true) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    
    if (includeTime) {
      return d.toLocaleString();
    } else {
      return d.toLocaleDateString();
    }
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date) {
    if (!date) return 'N/A';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },

  /**
   * Format risk score with color class
   */
  formatRiskScore(score) {
    if (typeof score !== 'number') return 'N/A';
    
    let className = 'risk-score--low';
    if (score >= 70) className = 'risk-score--high';
    else if (score >= 40) className = 'risk-score--medium';
    
    return {
      value: score,
      className: className,
      percentage: score
    };
  },

  /**
   * Format severity with appropriate styling
   */
  formatSeverity(severity) {
    if (!severity) return { text: 'UNKNOWN', className: 'severity-pill--unknown' };
    
    const severityMap = {
      'CRITICAL': { text: 'Critical', className: 'severity-pill--critical' },
      'HIGH': { text: 'High', className: 'severity-pill--high' },
      'MEDIUM': { text: 'Medium', className: 'severity-pill--medium' },
      'LOW': { text: 'Low', className: 'severity-pill--low' },
      'INFO': { text: 'Info', className: 'severity-pill--info' }
    };
    
    return severityMap[severity.toUpperCase()] || { text: severity, className: 'severity-pill--unknown' };
  },

  /**
   * Format confidence level
   */
  formatConfidence(confidence) {
    if (!confidence) return { text: 'UNKNOWN', className: 'confidence-pill--low' };
    
    const confidenceMap = {
      'HIGH': { text: 'High', className: 'confidence-pill--high' },
      'MEDIUM': { text: 'Medium', className: 'confidence-pill--medium' },
      'LOW': { text: 'Low', className: 'confidence-pill--low' }
    };
    
    return confidenceMap[confidence.toUpperCase()] || { text: confidence, className: 'confidence-pill--low' };
  },

  /**
   * Format dependency coordinate
   */
  formatDependencyCoordinate(dependency) {
    if (!dependency) return 'N/A';
    
    if (typeof dependency === 'string') {
      return dependency;
    }
    
    const { groupId, artifactId, version } = dependency;
    return `${groupId}:${artifactId}:${version}`;
  },

  /**
   * Truncate text with ellipsis
   */
  truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Format percentage
   */
  formatPercentage(value, decimals = 1) {
    if (typeof value !== 'number') return 'N/A';
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Format number with thousands separator
   */
  formatNumber(num) {
    if (typeof num !== 'number') return 'N/A';
    return num.toLocaleString();
  },

  /**
   * Format duration in milliseconds to human readable format
   */
  formatDuration(ms) {
    if (typeof ms !== 'number') return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  /**
   * Format CVE ID with link
   */
  formatCVE(cveId) {
    if (!cveId || !cveId.startsWith('CVE-')) return cveId;
    
    return {
      text: cveId,
      url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveId}`
    };
  },

  /**
   * Format build tool name
   */
  formatBuildTool(buildTool) {
    if (!buildTool) return 'Unknown';
    
    const toolMap = {
      'maven': 'Apache Maven',
      'gradle': 'Gradle',
      'auto': 'Auto-detect'
    };
    
    return toolMap[buildTool.toLowerCase()] || buildTool;
  },

  /**
   * Format analysis mode
   */
  formatAnalysisMode(mode) {
    if (!mode) return 'Unknown';
    
    const modeMap = {
      'safe': 'Safe Mode',
      'full': 'Full Mode'
    };
    
    return modeMap[mode.toLowerCase()] || mode;
  },

  /**
   * Format AI provider name
   */
  formatAIProvider(provider) {
    if (!provider) return 'Unknown';
    
    const providerMap = {
      'openai': 'OpenAI',
      'claude': 'Anthropic Claude',
      'gemini': 'Google Gemini',
      'ollama': 'Ollama',
      'azure-openai': 'Azure OpenAI'
    };
    
    return providerMap[provider.toLowerCase()] || provider;
  },

  /**
   * Format vulnerability source
   */
  formatVulnerabilitySource(source) {
    if (!source) return 'Unknown';
    
    const sourceMap = {
      'OSV': 'Open Source Vulnerability Database',
      'NVD': 'National Vulnerability Database',
      'GITHUB_ADVISORY': 'GitHub Advisory Database',
      'MAVEN_CENTRAL': 'Maven Central'
    };
    
    return sourceMap[source] || source;
  },

  /**
   * Format text for display (escape HTML, truncate, etc.)
   */
  formatDisplayText(text, maxLength = 100) {
    if (!text) return '';
    
    // Escape HTML
    const escaped = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Truncate if needed
    return this.truncateText(escaped, maxLength);
  },

  /**
   * Format code or technical text
   */
  formatCode(text) {
    if (!text) return '';
    return `<code class="font-mono">${this.escapeHtml(text)}</code>`;
  },

  /**
   * Escape HTML entities
   */
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Format list of items
   */
  formatList(items, formatter = null) {
    if (!Array.isArray(items) || items.length === 0) return 'None';
    
    const formattedItems = items.map(item => {
      return formatter ? formatter(item) : item;
    });
    
    return formattedItems.join(', ');
  },

  /**
   * Format JSON for display
   */
  formatJSON(obj, indent = 2) {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return 'Invalid JSON';
    }
  },

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number') return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Format template string with variables
   */
  formatTemplate(template, variables = {}) {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, 'g');
      result = result.replace(regex, value);
    });
    
    return result;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormatUtils;
}
