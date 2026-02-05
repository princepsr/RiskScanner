// Risk Scanner - Validation Utilities

window.ValidationUtils = {
  /**
   * Validate email address
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL
   */
  isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate API key format (basic validation)
   */
  isValidAPIKey(apiKey, provider) {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    const minLength = 10;
    if (apiKey.length < minLength) return false;
    
    // Provider-specific validation
    switch (provider?.toLowerCase()) {
      case 'openai':
        return apiKey.startsWith('sk-');
      case 'claude':
        return apiKey.startsWith('sk-ant-');
      case 'gemini':
        return apiKey.length >= 20;
      case 'azure-openai':
        return apiKey.length >= 20;
      default:
        return true; // Basic validation for unknown providers
    }
  },

  /**
   * Validate project path
   */
  isValidProjectPath(path) {
    if (!path || typeof path !== 'string') return false;
    
    // Basic path validation
    if (path.trim().length === 0) return false;
    
    // Check for invalid characters (Windows)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(path)) return false;
    
    return true;
  },

  /**
   * Validate file extension
   */
  isValidFileExtension(filename, allowedExtensions) {
    if (!filename || typeof filename !== 'string') return false;
    
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  },

  /**
   * Validate file size
   */
  isValidFileSize(file, maxSizeInBytes) {
    if (!file || !file.size) return false;
    return file.size <= maxSizeInBytes;
  },

  /**
   * Validate Maven coordinates
   */
  isValidMavenCoordinate(coordinate) {
    if (!coordinate || typeof coordinate !== 'string') return false;
    
    // Format: groupId:artifactId:version
    const parts = coordinate.split(':');
    if (parts.length !== 3) return false;
    
    const [groupId, artifactId, version] = parts;
    
    // Validate each part
    const validPart = (part) => {
      return part && part.length > 0 && /^[a-zA-Z0-9._-]+$/.test(part);
    };
    
    return validPart(groupId) && validPart(artifactId) && validPart(version);
  },

  /**
   * Validate version string
   */
  isValidVersion(version) {
    if (!version || typeof version !== 'string') return false;
    
    // Basic version validation (semantic versioning patterns)
    const versionRegex = /^(\d+)(\.\d+)*(\.[a-zA-Z0-9-]+)?$/;
    return versionRegex.test(version);
  },

  /**
   * Validate severity level
   */
  isValidSeverity(severity) {
    if (!severity || typeof severity !== 'string') return false;
    
    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
    return validSeverities.includes(severity.toUpperCase());
  },

  /**
   * Validate confidence level
   */
  isValidConfidence(confidence) {
    if (!confidence || typeof confidence !== 'string') return false;
    
    const validConfidence = ['HIGH', 'MEDIUM', 'LOW'];
    return validConfidence.includes(confidence.toUpperCase());
  },

  /**
   * Validate risk score (0-100)
   */
  isValidRiskScore(score) {
    return typeof score === 'number' && score >= 0 && score <= 100;
  },

  /**
   * Validate CVE ID format
   */
  isValidCVEId(cveId) {
    if (!cveId || typeof cveId !== 'string') return false;
    
    const cveRegex = /^CVE-\d{4}-\d{4,}$/;
    return cveRegex.test(cveId);
  },

  /**
   * Validate build tool
   */
  isValidBuildTool(buildTool) {
    if (!buildTool || typeof buildTool !== 'string') return false;
    
    const validTools = ['maven', 'gradle', 'auto'];
    return validTools.includes(buildTool.toLowerCase());
  },

  /**
   * Validate analysis mode
   */
  isValidAnalysisMode(mode) {
    if (!mode || typeof mode !== 'string') return false;
    
    const validModes = ['safe', 'full'];
    return validModes.includes(mode.toLowerCase());
  },

  /**
   * Validate AI provider
   */
  isValidAIProvider(provider) {
    if (!provider || typeof provider !== 'string') return false;
    
    const validProviders = ['openai', 'claude', 'gemini', 'ollama', 'azure-openai'];
    return validProviders.includes(provider.toLowerCase());
  },

  /**
   * Validate AI model name
   */
  isValidAIModel(model, provider) {
    if (!model || typeof model !== 'string') return false;
    if (model.length < 1 || model.length > 100) return false;
    
    // Basic validation - no invalid characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(model)) return false;
    
    // Provider-specific validation
    switch (provider?.toLowerCase()) {
      case 'openai':
        return /^gpt-[34].*|^text-davinci-/.test(model);
      case 'claude':
        return /^claude-/.test(model);
      case 'gemini':
        return /^gemini-/.test(model);
      case 'ollama':
        return /^[a-zA-Z0-9._-]+$/.test(model);
      case 'azure-openai':
        return /^gpt-[34].*|^text-davinci-/.test(model);
      default:
        return true;
    }
  },

  /**
   * Validate port number
   */
  isValidPort(port) {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  },

  /**
   * Validate JSON string
   */
  isValidJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') return false;
    
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate required fields in object
   */
  validateRequiredFields(obj, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!obj || obj[field] === undefined || obj[field] === null || obj[field] === '') {
        errors.push(`${field} is required`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Validate form data
   */
  validateFormData(formData, rules) {
    const errors = {};
    let isValid = true;
    
    Object.entries(rules).forEach(([field, rule]) => {
      const value = formData[field];
      let fieldValid = true;
      let error = '';
      
      // Required validation
      if (rule.required && (!value || value.toString().trim() === '')) {
        error = `${field} is required`;
        fieldValid = false;
      }
      
      // Type validation
      if (fieldValid && value && rule.type) {
        switch (rule.type) {
          case 'email':
            if (!this.isValidEmail(value)) {
              error = 'Invalid email format';
              fieldValid = false;
            }
            break;
          case 'url':
            if (!this.isValidURL(value)) {
              error = 'Invalid URL format';
              fieldValid = false;
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              error = 'Must be a number';
              fieldValid = false;
            }
            break;
          case 'file':
            if (rule.allowedExtensions && !this.isValidFileExtension(value.name, rule.allowedExtensions)) {
              error = `Invalid file type. Allowed: ${rule.allowedExtensions.join(', ')}`;
              fieldValid = false;
            }
            if (rule.maxSize && !this.isValidFileSize(value, rule.maxSize)) {
              error = `File too large. Maximum size: ${this.formatFileSize(rule.maxSize)}`;
              fieldValid = false;
            }
            break;
        }
      }
      
      // Custom validation
      if (fieldValid && rule.validate) {
        const customResult = rule.validate(value);
        if (customResult !== true) {
          error = customResult;
          fieldValid = false;
        }
      }
      
      if (!fieldValid) {
        errors[field] = error;
        isValid = false;
      }
    });
    
    return {
      isValid,
      errors
    };
  },

  /**
   * Sanitize input string
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/["']/g, '') // Remove quotes
      .substring(0, 1000); // Limit length
  },

  /**
   * Validate and sanitize project path
   */
  validateAndSanitizeProjectPath(path) {
    const sanitized = this.sanitizeInput(path);
    
    if (!this.isValidProjectPath(sanitized)) {
      return {
        isValid: false,
        error: 'Invalid project path',
        sanitized: null
      };
    }
    
    return {
      isValid: true,
      error: null,
      sanitized: sanitized
    };
  },

  /**
   * Validate file upload
   */
  validateFileUpload(file, options = {}) {
    const {
      allowedExtensions = ['.xml', '.gradle', '.kts'],
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedMimeTypes = ['text/xml', 'application/xml', 'text/plain']
    } = options;
    
    const errors = [];
    
    // Check file existence
    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }
    
    // Check file extension
    if (!this.isValidFileExtension(file.name, allowedExtensions)) {
      errors.push(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
    }
    
    // Check file size
    if (!this.isValidFileSize(file, maxSize)) {
      errors.push(`File too large. Maximum size: ${this.formatFileSize(maxSize)}`);
    }
    
    // Check MIME type
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate AI settings
   */
  validateAISettings(settings) {
    const errors = [];
    
    // Validate provider
    if (!settings.provider || !this.isValidAIProvider(settings.provider)) {
      errors.push('Invalid AI provider');
    }
    
    // Validate model
    if (!settings.model || !this.isValidAIModel(settings.model, settings.provider)) {
      errors.push('Invalid AI model');
    }
    
    // Validate API key (optional but recommended)
    if (settings.apiKey && !this.isValidAPIKey(settings.apiKey, settings.provider)) {
      errors.push('Invalid API key format');
    }
    
    // Validate Ollama-specific settings
    if (settings.provider === 'ollama') {
      if (settings.ollamaBaseUrl && !this.isValidURL(settings.ollamaBaseUrl)) {
        errors.push('Invalid Ollama base URL');
      }
    }
    
    // Validate Azure-specific settings
    if (settings.provider === 'azure-openai') {
      if (!settings.azureEndpoint || !this.isValidURL(settings.azureEndpoint)) {
        errors.push('Invalid Azure endpoint URL');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate vulnerability finding
   */
  validateVulnerabilityFinding(finding) {
    const errors = [];
    
    // Required fields
    const requiredFields = ['dependency', 'vulnerability'];
    const requiredValidation = this.validateRequiredFields(finding, requiredFields);
    
    if (!requiredValidation.isValid) {
      errors.push(...requiredValidation.errors);
    }
    
    // Validate dependency coordinate
    if (finding.dependency && !this.isValidMavenCoordinate(finding.dependency)) {
      errors.push('Invalid dependency coordinate');
    }
    
    // Validate severity
    if (finding.severity && !this.isValidSeverity(finding.severity)) {
      errors.push('Invalid severity level');
    }
    
    // Validate risk score
    if (finding.riskScore !== undefined && !this.isValidRiskScore(finding.riskScore)) {
      errors.push('Invalid risk score');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Create validation error message
   */
  createValidationError(field, message) {
    return {
      field,
      message,
      type: 'validation'
    };
  },

  /**
   * Check if object is empty
   */
  isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  },

  /**
   * Validate and sanitize user input
   */
  validateUserInput(input, options = {}) {
    const {
      maxLength = 1000,
      allowHTML = false,
      trim = true
    } = options;
    
    if (typeof input !== 'string') {
      return {
        isValid: false,
        error: 'Input must be a string',
        sanitized: null
      };
    }
    
    let sanitized = input;
    
    // Trim whitespace
    if (trim) {
      sanitized = sanitized.trim();
    }
    
    // Remove HTML if not allowed
    if (!allowHTML) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Check length
    if (sanitized.length > maxLength) {
      return {
        isValid: false,
        error: `Input too long. Maximum length: ${maxLength} characters`,
        sanitized: null
      };
    }
    
    return {
      isValid: true,
      error: null,
      sanitized
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationUtils;
}
