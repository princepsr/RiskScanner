# UI Development Guide

## Overview

Risk Scanner uses a vanilla HTML/CSS/JavaScript frontend for maximum compatibility, security, and maintainability. This guide covers the architecture, development workflow, and component structure.

## Architecture

### Technology Stack

- **HTML5**: Semantic markup with accessibility in mind
- **CSS3**: Modern CSS with Grid, Flexbox, and CSS Variables
- **Vanilla JavaScript**: ES6+ features, no frameworks or transpilation
- **Chart.js**: For data visualization (risk charts, dependency graphs)
- **Web Components**: For reusable UI elements

### Project Structure

```
src/main/resources/static/
├── index.html                 # Main application entry point
├── views/                     # HTML templates
│   ├── dashboard.html        # Main analysis view
│   ├── settings.html         # AI and analysis settings
│   ├── history.html          # Analysis history
│   └── help.html             # Documentation and help
├── components/                # Reusable HTML components
│   ├── navbar.html
│   ├── file-upload.html
│   ├── vulnerability-table.html
│   ├── risk-chart.html
│   └── ai-explanation.html
├── css/                       # Stylesheets
│   ├── main.css              # Main styles and variables
│   ├── components.css        # Component-specific styles
│   ├── responsive.css        # Mobile-first responsive design
│   └── themes.css            # Light/dark theme support
├── js/                        # JavaScript modules
│   ├── app.js                # Main application router
│   ├── api.js                # Backend API communication
│   ├── components/           # UI component logic
│   │   ├── navbar.js
│   │   ├── file-upload.js
│   │   ├── vulnerability-table.js
│   │   ├── risk-chart.js
│   │   └── ai-explanation.js
│   ├── utils/                # Utility functions
│   │   ├── dom.js
│   │   ├── format.js
│   │   └── validation.js
│   └── config.js             # Application configuration
├── assets/                    # Static assets
│   ├── icons/                # SVG icons
│   ├── images/               # Images and logos
│   └── fonts/                # Custom fonts
└── sw.js                      # Service worker for offline support
```

## Design System

### CSS Variables

```css
:root {
  /* Colors */
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --secondary-color: #64748b;
  --success-color: #16a34a;
  --warning-color: #d97706;
  --error-color: #dc2626;
  --info-color: #0891b2;
  
  /* Neutral Colors */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}
```

### Component Guidelines

#### 1. **Semantic HTML**
- Use appropriate HTML5 elements (`<main>`, `<section>`, `<article>`, etc.)
- Include proper ARIA labels and roles
- Ensure keyboard navigation support

#### 2. **CSS Architecture**
- **BEM-like naming**: `.component__element--modifier`
- **Mobile-first responsive design**
- **CSS Grid for layouts**, **Flexbox for components**
- **CSS Variables for theming**

#### 3. **JavaScript Patterns**
- **Module pattern** for component organization
- **Event delegation** for dynamic content
- **Fetch API** for backend communication
- **Error boundaries** and graceful degradation

## API Integration

### Backend Endpoints

```javascript
// API endpoints mapping
const API_ENDPOINTS = {
  // Vulnerability Analysis
  ANALYZE_SINGLE: '/api/vulnerabilities/analyze',
  ANALYZE_BATCH: '/api/vulnerabilities/analyze/batch',
  ANALYSIS_HISTORY: '/api/vulnerabilities/history',
  
  // AI Settings
  AI_SETTINGS: '/api/ai/settings',
  AI_TEST: '/api/ai/test',
  
  // Vulnerability Management
  SUPPRESS: '/api/vulnerabilities/suppress',
  UNSUPPRESS: '/api/vulnerabilities/unsuppress',
  
  // Export
  EXPORT_PDF: '/api/vulnerabilities/export/pdf',
  EXPORT_CSV: '/api/vulnerabilities/export/csv',
  EXPORT_JSON: '/api/vulnerabilities/export/json',
  
  // System
  HEALTH: '/api/health',
  VERSION: '/api/version'
};
```

### Request/Response Patterns

```javascript
// Standard API call pattern
class RiskScannerAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Vulnerability analysis
  async analyzeDependency(data) {
    return this.request(API_ENDPOINTS.ANALYZE_SINGLE, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // AI settings
  async getAISettings() {
    return this.request(API_ENDPOINTS.AI_SETTINGS);
  }

  async updateAISettings(settings) {
    return this.request(API_ENDPOINTS.AI_SETTINGS, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
}
```

## Component Development

### 1. **File Upload Component**

**Features:**
- Drag-and-drop file upload
- File validation (pom.xml, build.gradle, build.gradle.kts)
- Progress indicator
- Error handling

**HTML Structure:**
```html
<div class="file-upload" id="fileUpload">
  <div class="file-upload__dropzone">
    <svg class="file-upload__icon">...</svg>
    <p class="file-upload__text">Drag and drop your build file here</p>
    <p class="file-upload__subtext">or click to browse</p>
    <input type="file" class="file-upload__input" accept=".xml,.gradle,.kts" hidden>
  </div>
  <div class="file-upload__preview" hidden>
    <div class="file-upload__file-info">
      <span class="file-upload__filename"></span>
      <button class="file-upload__remove" type="button">×</button>
    </div>
  </div>
</div>
```

### 2. **Vulnerability Table Component**

**Features:**
- Sortable columns
- Filterable results
- Expandable rows for details
- AI explanations integration
- Bulk actions (suppress, export)

**Key Features:**
- Real-time search and filtering
- Pagination for large datasets
- Export to CSV/PDF
- Severity color coding
- Confidence level indicators

### 3. **Risk Visualization**

**Charts:**
- Severity distribution (pie chart)
- Risk score timeline (line chart)
- Dependency tree visualization
- Top vulnerable dependencies (bar chart)

**Libraries:**
- Chart.js for standard charts
- D3.js for complex visualizations
- Custom SVG for simple graphics

## Development Workflow

### 1. **Local Development**

```bash
# Start the Spring Boot application
./mvnw spring-boot:run

# Access the UI at http://localhost:8080
```

### 2. **File Organization**

- **Component-based development**: Each major UI element has its own HTML, CSS, and JS files
- **Progressive enhancement**: Core functionality works without JavaScript
- **Graceful degradation**: Fallbacks for older browsers

### 3. **Testing Strategy**

- **Manual testing**: Browser testing across different devices
- **Accessibility testing**: Screen reader and keyboard navigation
- **Performance testing**: Load times and responsiveness
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge

### 4. **Build Process**

- **No build step required**: Direct file editing
- **Live reload**: Browser auto-refresh on file changes
- **Minification**: Optional for production (can be added later)

## Responsive Design

### Breakpoints

```css
/* Mobile-first approach */
.component {
  /* Mobile styles (default) */
}

@media (min-width: 640px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}

@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

### Mobile Considerations

- **Touch-friendly buttons**: Minimum 44px tap targets
- **Readable text**: Minimum 16px font size
- **Simplified navigation**: Collapsible menu on mobile
- **Optimized forms**: Better input types and layouts

## Accessibility

### ARIA Implementation

```html
<!-- Example of accessible vulnerability table -->
<table role="table" aria-label="Vulnerability findings">
  <thead>
    <tr>
      <th scope="col" aria-sort="none">Severity</th>
      <th scope="col" aria-sort="none">Vulnerability ID</th>
      <th scope="col" aria-sort="none">Dependency</th>
      <th scope="col" aria-sort="none">Risk Score</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- Table rows -->
  </tbody>
</table>
```

### Keyboard Navigation

- **Tab order**: Logical focus flow
- **Skip links**: Quick navigation to main content
- **Focus indicators**: Visible focus states
- **Keyboard shortcuts**: Common actions (Ctrl+S for save, etc.)

## Performance Optimization

### Strategies

1. **Lazy Loading**: Load components as needed
2. **Code Splitting**: Separate JS modules for different views
3. **Image Optimization**: WebP format with fallbacks
4. **Caching**: Service worker for offline support
5. **Minification**: CSS/JS compression for production

### Monitoring

- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: Monitor JavaScript payload
- **Load Times**: Track page load performance
- **User Experience**: Interaction responsiveness

## Security Considerations

### Frontend Security

1. **Input Validation**: Client-side validation as first line of defense
2. **XSS Prevention**: Proper output encoding
3. **CSRF Protection**: Use same-site cookies
4. **Content Security Policy**: Restrict resource loading
5. **HTTPS Only**: Enforce secure connections

### Data Handling

- **Sensitive Data**: Don't log API keys or sensitive information
- **Local Storage**: Use sessionStorage for temporary data
- **Error Messages**: Don't expose internal system details
- **API Keys**: Handle securely, don't expose in frontend

## Deployment

### Static Asset Serving

Spring Boot automatically serves static files from `src/main/resources/static/`:

```
http://localhost:8080/          # index.html
http://localhost:8080/css/       # CSS files
http://localhost:8080/js/        # JavaScript files
http://localhost:8080/assets/    # Images and icons
```

### Production Considerations

1. **Asset Compression**: Gzip compression for static files
2. **Cache Headers**: Proper caching strategies
3. **CDN Integration**: Optional CDN for static assets
4. **Security Headers**: HSTS, X-Frame-Options, etc.
5. **Monitoring**: Error tracking and performance monitoring

## Contributing to UI Development

### Guidelines

1. **Follow the existing architecture** and naming conventions
2. **Write semantic HTML** with accessibility in mind
3. **Use CSS variables** for consistent theming
4. **Test across browsers** and devices
5. **Document new components** in this guide

### Code Review Checklist

- [ ] Semantic HTML structure
- [ ] Proper ARIA labels and roles
- [ ] Responsive design implementation
- [ ] Keyboard navigation support
- [ ] Error handling and loading states
- [ ] Cross-browser compatibility
- [ ] Performance considerations
- [ ] Security best practices

This UI development guide provides a comprehensive foundation for building a professional, maintainable frontend for Risk Scanner using vanilla web technologies.
