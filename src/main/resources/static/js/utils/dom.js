// Risk Scanner - DOM Utilities

window.DOMUtils = {
  /**
   * Element selection utilities
   */
  $(selector) {
    return document.getElementById(selector);
  },

  query(selector, context = document) {
    return context.querySelector(selector);
  },

  queryAll(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  /**
   * Element creation utilities
   */
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });
    
    // Add children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  },

  /**
   * Class manipulation utilities
   */
  addClass(element, ...classes) {
    if (element && element.classList) {
      element.classList.add(...classes);
    }
  },

  removeClass(element, ...classes) {
    if (element && element.classList) {
      element.classList.remove(...classes);
    }
  },

  toggleClass(element, className, force) {
    if (element && element.classList) {
      return element.classList.toggle(className, force);
    }
    return false;
  },

  hasClass(element, className) {
    if (element && element.classList) {
      return element.classList.contains(className);
    }
    return false;
  },

  /**
   * Style manipulation utilities
   */
  setStyle(element, styles) {
    if (element && element.style) {
      Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
      });
    }
  },

  getStyle(element, property) {
    if (element && element.style) {
      return getComputedStyle(element)[property];
    }
    return null;
  },

  /**
   * Attribute utilities
   */
  setAttribute(element, name, value) {
    if (element) {
      element.setAttribute(name, value);
    }
  },

  getAttribute(element, name) {
    if (element) {
      return element.getAttribute(name);
    }
    return null;
  },

  removeAttribute(element, name) {
    if (element) {
      element.removeAttribute(name);
    }
  },

  /**
   * Event handling utilities
   */
  on(element, event, handler, options = {}) {
    if (element) {
      element.addEventListener(event, handler, options);
    }
  },

  off(element, event, handler, options = {}) {
    if (element) {
      element.removeEventListener(event, handler, options);
    }
  },

  once(element, event, handler) {
    if (element) {
      element.addEventListener(event, handler, { once: true });
    }
  },

  delegate(parent, selector, event, handler) {
    if (parent) {
      parent.addEventListener(event, (e) => {
        if (e.target.matches(selector)) {
          handler.call(e.target, e);
        }
      });
    }
  },

  /**
   * Animation utilities
   */
  fadeIn(element, duration = 300) {
    if (element) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const start = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  },

  fadeOut(element, duration = 300) {
    if (element) {
      const start = performance.now();
      const startOpacity = parseFloat(getComputedStyle(element).opacity);
      
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = startOpacity * (1 - progress);
        
        if (progress >= 1) {
          element.style.display = 'none';
        } else {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  },

  slideDown(element, duration = 300) {
    if (element) {
      element.style.height = '0';
      element.style.overflow = 'hidden';
      element.style.display = 'block';
      
      const targetHeight = element.scrollHeight;
      const start = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.height = `${targetHeight * progress}px`;
        
        if (progress >= 1) {
          element.style.height = '';
          element.style.overflow = '';
        } else {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  },

  slideUp(element, duration = 300) {
    if (element) {
      const startHeight = element.scrollHeight;
      element.style.height = `${startHeight}px`;
      element.style.overflow = 'hidden';
      
      const start = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.height = `${startHeight * (1 - progress)}px`;
        
        if (progress >= 1) {
          element.style.display = 'none';
          element.style.height = '';
          element.style.overflow = '';
        } else {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  },

  /**
   * DOM manipulation utilities
   */
  empty(element) {
    if (element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
  },

  remove(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  },

  insertBefore(newElement, referenceElement) {
    if (referenceElement && referenceElement.parentNode) {
      referenceElement.parentNode.insertBefore(newElement, referenceElement);
    }
  },

  insertAfter(newElement, referenceElement) {
    if (referenceElement && referenceElement.parentNode) {
      referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    }
  },

  append(parent, child) {
    if (parent && child) {
      parent.appendChild(child);
    }
  },

  prepend(parent, child) {
    if (parent && child) {
      parent.insertBefore(child, parent.firstChild);
    }
  },

  /**
   * Form utilities
   */
  serializeForm(form) {
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values with same name
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  },

  populateForm(form, data) {
    if (!form || !data) return;
    
    Object.entries(data).forEach(([key, value]) => {
      const element = form.elements[key];
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = Boolean(value);
        } else if (element.type === 'radio') {
          if (element.value === String(value)) {
            element.checked = true;
          }
        } else {
          element.value = value;
        }
      }
    });
  },

  resetForm(form) {
    if (form) {
      form.reset();
    }
  },

  /**
   * Visibility utilities
   */
  show(element, display = 'block') {
    if (element) {
      element.style.display = display;
    }
  },

  hide(element) {
    if (element) {
      element.style.display = 'none';
    }
  },

  isVisible(element) {
    if (element) {
      return getComputedStyle(element).display !== 'none';
    }
    return false;
  },

  toggle(element, display = 'block') {
    if (element) {
      if (this.isVisible(element)) {
        this.hide(element);
      } else {
        this.show(element, display);
      }
    }
  },

  /**
   * Position utilities
   */
  getPosition(element) {
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY
      };
    }
    return null;
  },

  setPosition(element, position) {
    if (element && position) {
      Object.entries(position).forEach(([key, value]) => {
        element.style[key] = typeof value === 'number' ? `${value}px` : value;
      });
    }
  },

  /**
   * Scroll utilities
   */
  scrollTo(element, options = {}) {
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
        ...options
      });
    }
  },

  scrollToTop(element = window) {
    if (element === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (element) {
      element.scrollTop = 0;
    }
  },

  getScrollPosition(element = window) {
    if (element === window) {
      return {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset
      };
    } else if (element) {
      return {
        x: element.scrollLeft,
        y: element.scrollTop
      };
    }
    return { x: 0, y: 0 };
  },

  /**
   * Dimension utilities
   */
  getDimensions(element) {
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        innerWidth: element.clientWidth,
        innerHeight: element.clientHeight,
        outerWidth: element.offsetWidth,
        outerHeight: element.offsetHeight
      };
    }
    return null;
  },

  setDimensions(element, dimensions) {
    if (element && dimensions) {
      Object.entries(dimensions).forEach(([key, value]) => {
        if (typeof value === 'number') {
          element.style[key] = `${value}px`;
        } else {
          element.style[key] = value;
        }
      });
    }
  },

  /**
   * Focus utilities
   */
  focus(element) {
    if (element) {
      element.focus();
    }
  },

  blur(element) {
    if (element) {
      element.blur();
    }
  },

  hasFocus(element) {
    if (element) {
      return document.activeElement === element;
    }
    return false;
  },

  /**
   * Template utilities
   */
  template(templateId, data = {}) {
    const template = document.getElementById(templateId);
    if (!template) return null;
    
    let html = template.innerHTML;
    
    // Simple template interpolation
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, value);
    });
    
    return html;
  },

  /**
   * Loading utilities
   */
  showLoading(element, message = 'Loading...') {
    if (element) {
      this.addClass(element, 'loading');
      
      const loadingElement = this.createElement('div', {
        className: 'loading-indicator',
        innerHTML: `
          <div class="loading-spinner"></div>
          <span class="loading-message">${message}</span>
        `
      });
      
      element.appendChild(loadingElement);
    }
  },

  hideLoading(element) {
    if (element) {
      this.removeClass(element, 'loading');
      
      const loadingIndicator = element.querySelector('.loading-indicator');
      if (loadingIndicator) {
        this.remove(loadingIndicator);
      }
    }
  },

  /**
   * Error handling utilities
   */
  showError(element, message) {
    if (element) {
      this.addClass(element, 'error');
      
      const errorElement = this.createElement('div', {
        className: 'error-message',
        textContent: message
      });
      
      element.appendChild(errorElement);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.removeClass(element, 'error');
        if (errorElement.parentNode) {
          this.remove(errorElement);
        }
      }, 5000);
    }
  },

  clearError(element) {
    if (element) {
      this.removeClass(element, 'error');
      
      const errorMessage = element.querySelector('.error-message');
      if (errorMessage) {
        this.remove(errorMessage);
      }
    }
  },

  /**
   * Utility to wait for DOM ready
   */
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },

  /**
   * Utility to check if element exists in viewport
   */
  isInViewport(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Utility to wait for element to be available
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = this.$(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = this.$(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMUtils;
}
