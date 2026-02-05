// Risk Scanner - File Upload Component

class FileUploadComponent {
  constructor(options = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      allowedExtensions: options.allowedExtensions || ['.xml', '.gradle', '.kts'],
      allowedMimeTypes: options.allowedMimeTypes || ['text/xml', 'application/xml', 'text/plain'],
      onFileSelect: options.onFileSelect || null,
      onError: options.onError || null,
      onSuccess: options.onSuccess || null,
      ...options
    };
    
    this.currentFile = null;
    this.dropzone = null;
    this.fileInput = null;
    this.preview = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
  }

  setupElements() {
    this.dropzone = DOMUtils.$('fileUploadDropzone');
    this.fileInput = DOMUtils.$('fileInput');
    this.preview = DOMUtils.$('filePreview');
    
    if (!this.dropzone || !this.fileInput) {
      console.error('File upload elements not found');
      return;
    }
  }

  setupEventListeners() {
    // Dropzone events
    DOMUtils.on(this.dropzone, 'click', () => {
      this.fileInput.click();
    });

    DOMUtils.on(this.dropzone, 'dragover', (e) => {
      e.preventDefault();
      DOMUtils.addClass(this.dropzone, 'drag-over');
    });

    DOMUtils.on(this.dropzone, 'dragleave', (e) => {
      e.preventDefault();
      DOMUtils.removeClass(this.dropzone, 'drag-over');
    });

    DOMUtils.on(this.dropzone, 'drop', (e) => {
      e.preventDefault();
      DOMUtils.removeClass(this.dropzone, 'drag-over');
      this.handleFiles(e.dataTransfer.files);
    });

    // File input events
    DOMUtils.on(this.fileInput, 'change', (e) => {
      this.handleFiles(e.target.files);
    });
  }

  handleFiles(files) {
    if (files.length === 0) return;
    
    // Only handle the first file for now
    const file = files[0];
    this.validateAndSetFile(file);
  }

  validateAndSetFile(file) {
    // Validate file
    const validation = this.validateFile(file);
    
    if (!validation.isValid) {
      this.showError(validation.errors.join(', '));
      if (this.options.onError) {
        this.options.onError(validation.errors);
      }
      return;
    }

    // Set the file
    this.currentFile = file;
    this.showFilePreview(file);
    
    if (this.options.onFileSelect) {
      this.options.onFileSelect(file);
    }
  }

  validateFile(file) {
    const errors = [];
    
    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.options.allowedExtensions.includes(extension)) {
      errors.push(`Invalid file type. Allowed: ${this.options.allowedExtensions.join(', ')}`);
    }
    
    // Check file size
    if (file.size > this.options.maxFileSize) {
      errors.push(`File too large. Maximum size: ${this.formatFileSize(this.options.maxFileSize)}`);
    }
    
    // Check MIME type
    if (this.options.allowedMimeTypes && !this.options.allowedMimeTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  showFilePreview(file) {
    if (!this.preview) return;
    
    // Hide dropzone
    DOMUtils.hide(this.dropzone);
    
    // Show preview
    DOMUtils.show(this.preview);
    
    // Update preview content
    const fileName = DOMUtils.$('fileName');
    const fileSize = DOMUtils.$('fileSize');
    
    if (fileName) {
      fileName.textContent = file.name;
    }
    
    if (fileSize) {
      fileSize.textContent = this.formatFileSize(file.size);
    }
    
    // Setup remove button
    const removeBtn = DOMUtils.$('removeFile');
    if (removeBtn) {
      DOMUtils.on(removeBtn, 'click', () => {
        this.removeFile();
      });
    }
  }

  removeFile() {
    this.currentFile = null;
    
    // Hide preview
    if (this.preview) {
      DOMUtils.hide(this.preview);
    }
    
    // Show dropzone
    if (this.dropzone) {
      DOMUtils.show(this.dropzone);
    }
    
    // Clear file input
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    
    // Clear any error messages
    this.clearError();
    
    if (this.options.onSuccess) {
      this.options.onSuccess('File removed');
    }
  }

  getFile() {
    return this.currentFile;
  }

  hasFile() {
    return this.currentFile !== null;
  }

  showError(message) {
    this.clearError();
    
    const errorElement = DOMUtils.createElement('div', {
      className: 'file-upload__error',
      textContent: message
    });
    
    if (this.dropzone) {
      DOMUtils.addClass(this.dropzone, 'file-upload--error');
      DOMUtils.append(this.dropzone, errorElement);
    }
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  clearError() {
    if (this.dropzone) {
      DOMUtils.removeClass(this.dropzone, 'file-upload--error');
      const errorElement = this.dropzone.querySelector('.file-upload__error');
      if (errorElement) {
        DOMUtils.remove(errorElement);
      }
    }
  }

  showSuccess(message) {
    this.clearError();
    
    const successElement = DOMUtils.createElement('div', {
      className: 'file-upload__success',
      textContent: message
    });
    
    if (this.dropzone) {
      DOMUtils.addClass(this.dropzone, 'file-upload--success');
      DOMUtils.append(this.dropzone, successElement);
    }
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      this.clearSuccess();
    }, 3000);
  }

  clearSuccess() {
    if (this.dropzone) {
      DOMUtils.removeClass(this.dropzone, 'file-upload--success');
      const successElement = this.dropzone.querySelector('.file-upload__success');
      if (successElement) {
        DOMUtils.remove(successElement);
      }
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  reset() {
    this.removeFile();
  }

  destroy() {
    // Clean up event listeners
    if (this.dropzone) {
      DOMUtils.off(this.dropzone, 'click');
      DOMUtils.off(this.dropzone, 'dragover');
      DOMUtils.off(this.dropzone, 'dragleave');
      DOMUtils.off(this.dropzone, 'drop');
    }
    
    if (this.fileInput) {
      DOMUtils.off(this.fileInput, 'change');
    }
    
    // Reset state
    this.currentFile = null;
    this.dropzone = null;
    this.fileInput = null;
    this.preview = null;
  }
}

// Auto-initialize when DOM is ready
DOMUtils.ready(() => {
  // Look for file upload components
  const fileUploadElements = DOMUtils.queryAll('[data-file-upload]');
  
  fileUploadElements.forEach(element => {
    const options = JSON.parse(element.getAttribute('data-file-upload') || '{}');
    new FileUploadComponent(options);
  });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileUploadComponent;
}
