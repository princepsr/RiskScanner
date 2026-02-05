// Risk Scanner - Risk Chart Component

class RiskChartComponent {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'riskChart',
      chartType: options.chartType || 'bar',
      colors: {
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#d97706',
        low: '#65a30d',
        info: '#0891b2',
        unknown: '#64748b'
      },
      animationDuration: options.animationDuration || 750,
      responsive: options.responsive !== false,
      maintainAspectRatio: options.maintainAspectRatio !== false,
      ...options
    };
    
    this.container = null;
    this.charts = {};
    this.data = null;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.loadChartLibrary();
  }

  setupElements() {
    this.container = DOMUtils.$(this.options.containerId);
    if (!this.container) {
      console.error(`Risk chart container not found: ${this.options.containerId}`);
      return;
    }
  }

  loadChartLibrary() {
    // Load Chart.js library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      this.onChartLibraryLoaded();
    };
    script.onerror = () => {
      console.error('Failed to load Chart.js library');
      this.createFallbackCharts();
    };
    
    document.head.appendChild(script);
  }

  onChartLibraryLoaded() {
    console.log('Chart.js loaded successfully');
    this.createCharts();
  }

  createCharts() {
    if (!this.container || !window.Chart) return;
    
    // Clear existing charts
    this.container.innerHTML = '';
    
    // Create chart grid
    const chartGrid = DOMUtils.createElement('div', {
      className: 'charts-grid'
    });
    
    // Severity Distribution Chart
    const severityChartContainer = this.createChartContainer('Severity Distribution');
    const severityCanvas = this.createCanvas('severityChart');
    DOMUtils.append(severityChartContainer, severityCanvas);
    DOMUtils.append(chartGrid, severityChartContainer);
    
    // Risk Score Distribution Chart
    const riskScoreChartContainer = this.createChartContainer('Risk Score Distribution');
    const riskScoreCanvas = this.createCanvas('riskScoreChart');
    DOMUtils.append(riskScoreChartContainer, riskScoreCanvas);
    DOMUtils.append(chartGrid, riskScoreChartContainer);
    
    // Top Vulnerable Dependencies Chart
    const topDepsChartContainer = this.createChartContainer('Top Vulnerable Dependencies', 'chart-container--full');
    const topDepsCanvas = this.createCanvas('topDependenciesChart');
    DOMUtils.append(topDepsChartContainer, topDepsCanvas);
    DOMUtils.append(chartGrid, topDepsChartContainer);
    
    DOMUtils.append(this.container, chartGrid);
    
    // Create chart instances
    this.charts.severity = this.createSeverityChart(severityCanvas);
    this.charts.riskScore = this.createRiskScoreChart(riskScoreCanvas);
    this.charts.topDependencies = this.createTopDependenciesChart(topDepsCanvas);
  }

  createChartContainer(title, className = '') {
    return DOMUtils.createElement('div', {
      className: `chart-container ${className}`
    }, [
      DOMUtils.createElement('h3', {
        className: 'chart__title',
        textContent: title
      })
    ]);
  }

  createCanvas(canvasId) {
    return DOMUtils.createElement('canvas', {
      id: canvasId,
      className: 'chart'
    });
  }

  createSeverityChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            this.options.colors.critical,
            this.options.colors.high,
            this.options.colors.medium,
            this.options.colors.low,
            this.options.colors.info
          ],
          borderWidth: 2,
          borderColor: '#1e293b'
        }]
      },
      options: {
        responsive: this.options.responsive,
        maintainAspectRatio: this.options.maintainAspectRatio,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
  }

  createRiskScoreChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
        datasets: [{
          label: 'Count',
          data: [0, 0, 0, 0, 0],
          backgroundColor: this.options.colors.low,
          borderColor: this.options.colors.low,
          borderWidth: 1
        }]
      },
      options: {
        responsive: this.options.responsive,
        maintainAspectRatio: this.options.maintainAspectRatio,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Vulnerabilities'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Risk Score Range'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Risk Score ${context.label}: ${context.parsed.y} vulnerabilities`;
              }
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
  }

  createTopDependenciesChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Risk Score',
          data: [],
          backgroundColor: this.options.colors.high,
          borderColor: this.options.colors.high,
          borderWidth: 1
        }]
      },
      options: {
        responsive: this.options.responsive,
        maintainAspectRatio: this.options.maintainAspectRatio,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Risk Score'
            },
            max: 100
          },
          y: {
            title: {
              display: true,
              text: 'Dependencies'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.x}`;
              }
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
  }

  render(data) {
    this.data = data || [];
    
    if (!this.charts.severity || !this.charts.riskScore || !this.charts.topDependencies) {
      return;
    }
    
    // Calculate chart data
    const severityData = this.calculateSeverityData();
    const riskScoreData = this.calculateRiskScoreData();
    const topDependenciesData = this.calculateTopDependenciesData();
    
    // Update charts
    this.updateSeverityChart(severityData);
    this.updateRiskScoreChart(riskScoreData);
    this.updateTopDependenciesChart(topDependenciesData);
  }

  calculateSeverityData() {
    const severityCount = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    this.data.forEach(item => {
      const severity = item.riskLevel || item.severity || 'UNKNOWN';
      const severityKey = severity.toLowerCase();
      
      if (severityCount[severityKey] !== undefined) {
        severityCount[severityKey]++;
      }
    });
    
    return Object.values(severityCount);
  }

  calculateRiskScoreData() {
    const scoreRanges = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    
    this.data.forEach(item => {
      const score = item.riskScore || 0;
      
      if (score <= 20) scoreRanges[0]++;
      else if (score <= 40) scoreRanges[1]++;
      else if (score <= 60) scoreRanges[2]++;
      else if (score <= 80) scoreRanges[3]++;
      else scoreRanges[4]++;
    });
    
    return scoreRanges;
  }

  calculateTopDependenciesData() {
    // Group by dependency and calculate average risk score
    const dependencyScores = {};
    
    this.data.forEach(item => {
      const depKey = this.getDependencyKey(item.dependency);
      const score = item.riskScore || 0;
      
      if (!dependencyScores[depKey]) {
        dependencyScores[depKey] = {
          dependency: item.dependency,
          scores: [],
          count: 0
        };
      }
      
      dependencyScores[depKey].scores.push(score);
      dependencyScores[depKey].count++;
    });
    
    // Calculate average scores and sort
    const topDependencies = Object.values(dependencyScores)
      .map(dep => ({
        dependency: dep.dependency,
        averageScore: dep.scores.reduce((a, b) => a + b, 0) / dep.count,
        count: dep.count
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10); // Top 10
    
    return {
      labels: topDependencies.map(dep => this.formatDependencyLabel(dep.dependency)),
      data: topDependencies.map(dep => Math.round(dep.averageScore))
    };
  }

  getDependencyKey(dependency) {
    if (typeof dependency === 'string') return dependency;
    if (dependency && dependency.artifactId) return `${dependency.groupId}:${dependency.artifactId}`;
    return 'unknown';
  }

  formatDependencyLabel(dependency) {
    if (typeof dependency === 'string') return dependency;
    return `${dependency.groupId}:${dependency.artifactId}`;
  }

  updateSeverityChart(data) {
    if (!this.charts.severity) return;
    
    this.charts.severity.data.datasets[0].data = data;
    this.charts.severity.update();
  }

  updateRiskScoreChart(data) {
    if (!this.charts.riskScore) return;
    
    this.charts.riskScore.data.datasets[0].data = data;
    this.charts.riskScore.update();
  }

  updateTopDependenciesChart(data) {
    if (!this.charts.topDependencies) return;
    
    this.charts.topDependencies.data.labels = data.labels;
    this.charts.topDependencies.data.datasets[0].data = data.data;
    this.charts.topDependencies.update();
  }

  createFallbackCharts() {
    console.log('Creating fallback charts without Chart.js');
    
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="charts-grid">
        <div class="chart-container">
          <h3 class="chart__title">Severity Distribution</h3>
          <div class="fallback-chart">
            <div class="fallback-chart__legend">
              <div class="fallback-chart__item">
                <span class="fallback-chart__color" style="background-color: ${this.options.colors.critical}"></span>
                <span>Critical</span>
                <span class="fallback-chart__count">0</span>
              </div>
              <div class="fallback-chart__item">
                <span class="fallback-chart__color" style="background-color: ${this.options.colors.high}"></span>
                <span>High</span>
                <span class="fallback-chart__count">0</span>
              </div>
              <div class="fallback-chart__item">
                <span class="fallback-chart__color" style="background-color: ${this.options.colors.medium}"></span>
                <span>Medium</span>
                <span class="fallback-chart__count">0</span>
              </div>
              <div class="fallback-chart__item">
                <span class="fallback-chart__color" style="background-color: ${this.options.colors.low}"></span>
                <span>Low</span>
                <span class="fallback-chart__count">0</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-container">
          <h3 class="chart__title">Risk Score Distribution</h3>
          <div class="fallback-chart">
            <div class="fallback-chart__bars">
              <div class="fallback-chart__bar">
                <span class="fallback-chart__label">0-20</span>
                <div class="fallback-chart__bar-fill" style="width: 0%"></div>
              </div>
              <div class="fallback-chart__bar">
                <span class="fallback-chart__label">21-40</span>
                <div class="fallback-chart__bar-fill" style="width: 0%"></div>
              </div>
              <div class="fallback-chart__bar">
                <span class="fallback-chart__label">41-60</span>
                <div class="fallback-chart__bar-fill" style="width: 0%"></div>
              </div>
              <div class="fallback-chart__bar">
                <span class="fallback-chart__label">61-80</span>
                <div class="fallback-chart__bar-fill" style="width: 0%"></div>
              </div>
              <div class="fallback-chart__bar">
                <span class="fallback-chart__label">81-100</span>
                <div class="fallback-chart__bar-fill" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-container chart-container--full">
          <h3 class="chart__title">Top Vulnerable Dependencies</h3>
          <div class="fallback-chart">
            <div class="fallback-chart__list">
              <p>No data available</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  updateFallbackCharts() {
    if (!this.container || !this.data) return;
    
    const severityData = this.calculateSeverityData();
    const riskScoreData = this.calculateRiskScoreData();
    const topDependenciesData = this.calculateTopDependenciesData();
    
    // Update severity chart
    const severityLegend = this.container.querySelector('.fallback-chart__legend');
    if (severityLegend) {
      const items = severityLegend.querySelectorAll('.fallback-chart__item');
      const severityTypes = ['critical', 'high', 'medium', 'low'];
      
      items.forEach((item, index) => {
        if (index < severityTypes.length) {
          const count = severityData[index] || 0;
          const countElement = item.querySelector('.fallback-chart__count');
          if (countElement) {
            countElement.textContent = count;
          }
        }
      });
    }
    
    // Update risk score chart
    const riskBars = this.container.querySelectorAll('.fallback-chart__bar');
    const maxRiskScore = Math.max(...riskScoreData, 1);
    
    riskBars.forEach((bar, index) => {
      const label = bar.querySelector('.fallback-chart__label');
      const fill = bar.querySelector('.fallback-chart__bar-fill');
      
      if (label && fill) {
        const percentage = (riskScoreData[index] / maxRiskScore) * 100;
        fill.style.width = `${percentage}%`;
      }
    });
    
    // Update top dependencies chart
    const topDepsList = this.container.querySelector('.fallback-chart__list');
    if (topDepsList && topDependenciesData.labels.length > 0) {
      topDepsList.innerHTML = topDependenciesData.labels.map((label, index) => {
        const score = topDependenciesData.data[index];
        return `
          <div class="fallback-chart__item">
            <span class="fallback-chart__label">${FormatUtils.escapeHtml(label)}</span>
            <span class="fallback-chart__score">Score: ${score}</span>
          </div>
        `;
      }).join('');
    }
  }

  resize() {
    // Resize all charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }

  destroy() {
    // Destroy all charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    this.charts = {};
    this.data = null;
    this.container = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RiskChartComponent;
}
