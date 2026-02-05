// Risk Scanner - AI Explanation Component

class AIExplanationComponent {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'aiExplanation',
      maxLength: options.maxLength || 500,
      minLength: options.minLength || 50,
      loadingText: options.loadingText || 'Generating AI analysis...',
      errorText: options.errorText || 'AI analysis unavailable',
      ...options
    };
    
    this.container = null;
    this.cache = new Map();
    this.currentRequests = new Map();
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
  }

  setupElements() {
    this.container = DOMUtils.$(this.options.containerId);
    if (!this.container) {
      console.error(`AI explanation container not found: ${this.options.containerId}`);
      return;
    }
  }

  setupEventListeners() {
    // Event listeners will be set up when needed
  }

  async generateExplanation(finding, dependencyPath, options = {}) {
    const cacheKey = this.getCacheKey(finding, dependencyPath);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Check if request is already in progress
    if (this.currentRequests.has(cacheKey)) {
      return this.currentRequests.get(cacheKey);
    }
    
    // Show loading state
    this.showLoading(cacheKey);
    
    try {
      // Generate explanation
      const explanation = await this.callAI(finding, dependencyPath, options);
      
      // Cache the result
      this.cache.set(cacheKey, explanation);
      
      // Remove from current requests
      this.currentRequests.delete(cacheKey);
      
      return explanation;
      
    } catch (error) {
      console.error('AI explanation generation failed:', error);
      
      // Remove from current requests
      this.currentRequests.delete(cacheKey);
      
      // Show error state
      this.showError(cacheKey, error.message);
      
      return {
        text: this.options.errorText,
        error: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  getCacheKey(finding, dependencyPath) {
    const findingId = finding.id || finding.vulnerability?.id || 'unknown';
    const pathStr = dependencyPath ? dependencyPath.join('->') : 'direct';
    return `${findingId}:${pathStr}`;
  }

  async callAI(finding, dependencyPath, options = {}) {
    // This would integrate with the actual AI service
    // For now, return a mock explanation
    return this.generateMockExplanation(finding, dependencyPath);
  }

  generateMockExplanation(finding, dependencyPath) {
    const severity = finding.riskLevel || finding.severity || 'UNKNOWN';
    const dependency = finding.dependency || {};
    const vulnerability = finding.vulnerability || {};
    
    const explanation = `
      **Vulnerability Analysis**: ${vulnerability.title || 'Unknown Vulnerability'}
      
      **Risk Level**: ${severity}
      
      **Impact**: This vulnerability in ${dependency.groupId}:${dependency.artifactId} could potentially impact your application's security posture. The ${severity.toLowerCase()} severity indicates that ${this.getImpactDescription(severity)}.
      
      **Affected Version**: ${dependency.version}
      
      **Recommendation**: ${this.getRecommendation(severity)}
      
      **Context**: ${dependencyPath.length > 1 ? `This vulnerability affects a transitive dependency at depth ${dependencyPath.length}` : 'This is a direct dependency.'}
      
      **AI Confidence**: ${this.calculateConfidence(finding)}
    `.trim();
    
    return {
      text: explanation,
      confidence: this.calculateConfidence(finding),
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  getImpactDescription(severity) {
    const descriptions = {
      'CRITICAL': 'immediate action is required as this vulnerability can be easily exploited and may lead to complete system compromise',
      'HIGH': 'this vulnerability should be addressed in the next release cycle as it could be exploited with moderate effort',
      'MEDIUM': 'this vulnerability should be addressed in a future release cycle as exploitation requires specific conditions',
      'LOW': 'this vulnerability has a low likelihood of exploitation but should be monitored',
      'INFO': 'this is an informational finding that may require attention'
    };
    
    return descriptions[severity.toUpperCase()] || 'this requires attention';
  }

  getRecommendation(severity) {
    const recommendations = {
      'CRITICAL': 'Update to a patched version immediately or implement compensating controls',
      'HIGH': 'Update to a patched version as soon as possible',
      'MEDIUM': 'Plan to update to a patched version in the next release cycle',
      'LOW': 'Consider updating when convenient or monitor for updates',
      'INFO': 'Review the finding for potential security implications'
    };
    
    return recommendations[severity.toUpperCase()] || 'Review and update as needed';
  }

  calculateConfidence(finding) {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on multiple sources
    if (finding.sources && finding.sources.length > 1) {
      confidence += 20;
    }
    
    // Increase confidence for exact version matches
    if (finding.exactVersionMatch) {
      confidence += 20;
    }
    
    // Increase confidence for high-quality sources
    if (finding.source === 'NVD' || finding.source === 'GitHub Advisory') {
      confidence += 10;
    }
    
    return Math.min(confidence, 100);
  }

  showLoading(cacheKey) {
    const loadingElement = this.getOrCreateElement(cacheKey);
    loadingElement.innerHTML = `
      <div class="ai-explanation__loading">
        <div class="ai-explanation__spinner"></div>
        <span>${this.options.loadingText}</span>
      </div>
    `;
    loadingElement.className = 'ai-explanation__content';
  }

  showError(cacheKey, errorMessage) {
    const element = this.getOrCreateElement(cacheKey);
    element.innerHTML = `
      <div class="ai-explanation__error">
        <div class="ai-explanation__icon">⚠️</div>
        <div class="ai-explanation__message">${errorMessage}</div>
        <button class="ai-explanation__retry" onclick="window.aiExplanationComponent.retry('${cacheKey}')">
          Retry
        </button>
      </div>
    `;
    element.className = 'ai-explanation__content ai-explanation__error';
  }

  showExplanation(cacheKey, explanation) {
    const element = this.getOrCreateElement(cacheKey);
    
    if (explanation.error) {
      this.showError(cacheKey, explanation.text);
      return;
    }
    
    element.innerHTML = `
      <div class="ai-explanation__header">
        <div class="ai-explanation__confidence">
          Confidence: ${explanation.confidence}%
          ${explanation.mock ? '<span class="ai-explanation__mock">(Mock)</span>' : ''}
        </div>
        <div class="ai-explanation__timestamp">
          ${FormatUtils.formatRelativeTime(explanation.timestamp)}
        </div>
      </div>
      <div class="ai-explanation__text">
        ${FormatUtils.formatDisplayText(explanation.text, 1000).replace(/\n/g, '<br>')}
      </div>
    `;
    element.className = 'ai-explanation__content';
  }

  getOrCreateElement(cacheKey) {
    let element = DOMUtils.$(`ai-explanation-${cacheKey}`);
    
    if (!element) {
      element = DOMUtils.createElement('div', {
        id: `ai-explanation-${cacheKey}`,
        className: 'ai-explanation__content'
      });
      
      if (this.container) {
        DOMUtils.append(this.container, element);
      }
    }
    
    return element;
  }

  retry(cacheKey) {
    // Remove from cache and current requests
    this.cache.delete(cacheKey);
    this.currentRequests.delete(cacheKey);
    
    // Re-trigger the explanation generation
    // This would need the original finding and dependencyPath
    console.log('Retrying AI explanation for:', cacheKey);
  }

  clearCache() {
    this.cache.clear();
    this.currentRequests.clear();
    
    if (this.container) {
      DOMUtils.empty(this.container);
    }
  }

  clearCacheEntry(cacheKey) {
    this.cache.delete(cacheKey);
    this.currentRequests.delete(cacheKey);
    
    const element = DOMUtils.$(`ai-explanation-${cacheKey}`);
    if (element) {
      DOMUtils.remove(element);
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      requests: this.currentRequests.size,
      keys: Array.from(this.cache.keys())
    };
  }

  destroy() {
    this.clearCache();
    this.container = null;
    this.cache = null;
    this.currentRequests = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIExplanationComponent;
}
