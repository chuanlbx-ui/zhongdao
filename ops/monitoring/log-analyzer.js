#!/usr/bin/env node

/**
 * 日志分析工具
 * 分析日志文件，生成报告和统计信息
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class LogAnalyzer {
  constructor() {
    this.logDir = './logs';
    this.colors = require('colors');
    this.report = {
      timestamp: new Date().toISOString(),
      services: {},
      errors: [],
      performance: {},
      requests: {},
      summary: {}
    };
  }

  /**
   * 分析所有日志
   */
  async analyze() {
    console.log('📊 Analyzing logs...\n');

    const services = ['api', 'h5', 'admin'];

    for (const service of services) {
      await this.analyzeService(service);
    }

    this.generateSummary();
    this.saveReport();
    this.displayReport();

    console.log('\n✅ Analysis complete. Report saved to logs/monitor/analysis-report.json');
  }

  /**
   * 分析单个服务
   */
  async analyzeService(service) {
    console.log(`🔍 Analyzing ${service} service...`);

    const logFile = path.join(this.logDir, service, 'combined.log');
    if (!fs.existsSync(logFile)) {
      console.log(`⚠️  No log file found for ${service}`);
      return;
    }

    const serviceData = {
      lines: 0,
      errors: 0,
      warnings: 0,
      responseTime: [],
      statusCode: {},
      ipAddresses: new Set(),
      endpoints: new Map(),
      errors: []
    };

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      serviceData.lines++;

      // 分析错误
      if (this.isError(line)) {
        serviceData.errors++;
        serviceData.errors.push({
          timestamp: this.extractTimestamp(line),
          message: line
        });
      }

      // 分析警告
      if (this.isWarning(line)) {
        serviceData.warnings++;
      }

      // 提取响应时间
      const responseTime = this.extractResponseTime(line);
      if (responseTime) {
        serviceData.responseTime.push(responseTime);
      }

      // 提取状态码
      const statusCode = this.extractStatusCode(line);
      if (statusCode) {
        serviceData.statusCode[statusCode] = (serviceData.statusCode[statusCode] || 0) + 1;
      }

      // 提取IP地址
      const ip = this.extractIpAddress(line);
      if (ip) {
        serviceData.ipAddresses.add(ip);
      }

      // 提取API端点
      const endpoint = this.extractEndpoint(line);
      if (endpoint) {
        const count = serviceData.endpoints.get(endpoint) || 0;
        serviceData.endpoints.set(endpoint, count + 1);
      }
    }

    // 计算统计信息
    serviceData.avgResponseTime = serviceData.responseTime.length > 0
      ? serviceData.responseTime.reduce((a, b) => a + b, 0) / serviceData.responseTime.length
      : 0;

    serviceData.p95ResponseTime = this.calculatePercentile(serviceData.responseTime, 95);
    serviceData.uniqueIPs = serviceData.ipAddresses.size;
    serviceData.topEndpoints = Array.from(serviceData.endpoints.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    this.report.services[service] = serviceData;
  }

  /**
   * 判断是否为错误
   */
  isError(line) {
    const errorPatterns = [
      /\berror\b/i,
      /\bexception\b/i,
      /\bfailed\b/i,
      /\bfatal\b/i,
      /\bpanic\b/i,
      /\bcrashed\b/i,
      /status\s*:\s*5\d{2}/
    ];
    return errorPatterns.some(pattern => pattern.test(line));
  }

  /**
   * 判断是否为警告
   */
  isWarning(line) {
    const warningPatterns = [
      /\bwarn\b/i,
      /\bwarning\b/i,
      /\bdeprecated\b/i,
      /status\s*:\s*4\d{2}/
    ];
    return warningPatterns.some(pattern => pattern.test(line));
  }

  /**
   * 提取时间戳
   */
  extractTimestamp(line) {
    const patterns = [
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)/,
      /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
      /(\w{3} \d{2} \d{2}:\d{2}:\d{2})/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * 提取响应时间
   */
  extractResponseTime(line) {
    const patterns = [
      /duration[:\s]+(\d+)ms/,
      /response[:\s]+(\d+)ms/,
      /took[:\s]+(\d+)ms/,
      /time[:\s]+(\d+)ms/,
      /\[(\d+)ms\]/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  /**
   * 提取状态码
   */
  extractStatusCode(line) {
    const pattern = /status[:\s]+(\d{3})/i;
    const match = line.match(pattern);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * 提取IP地址
   */
  extractIpAddress(line) {
    const patterns = [
      /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/,
      /ip[:\s]+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
    return null;
  }

  /**
   * 提取API端点
   */
  extractEndpoint(line) {
    const patterns = [
      /(?:GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/,
      /endpoint[:\s]+([^\s]+)/i,
      /path[:\s]+([^\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1] !== '/' && match[1].includes('/')) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * 计算百分位数
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * 生成汇总信息
   */
  generateSummary() {
    const services = Object.values(this.report.services);

    this.report.summary = {
      totalLines: services.reduce((sum, s) => sum + s.lines, 0),
      totalErrors: services.reduce((sum, s) => sum + s.errors, 0),
      totalWarnings: services.reduce((sum, s) => sum + s.warnings, 0),
      avgResponseTime: services.reduce((sum, s) => sum + s.avgResponseTime, 0) / services.length,
      uniqueIPs: [...new Set(services.flatMap(s => Array.from(s.ipAddresses)))].length,
      mostErrors: services.reduce((max, s) => s.errors > (max?.errors || 0) ? { service: '', count: s.errors } : max, null),
      topEndpoint: this.getTopEndpointAcrossServices(services)
    };
  }

  /**
   * 获取跨服务的最热门端点
   */
  getTopEndpointAcrossServices(services) {
    const endpointCounts = new Map();

    services.forEach(service => {
      service.endpoints.forEach((count, endpoint) => {
        const total = endpointCounts.get(endpoint) || 0;
        endpointCounts.set(endpoint, total + count);
      });
    });

    const sorted = Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    return sorted[0] ? { endpoint: sorted[0][0], count: sorted[0][1] } : null;
  }

  /**
   * 保存报告
   */
  saveReport() {
    const reportPath = path.join(this.logDir, 'monitor', 'analysis-report.json');

    // 确保目录存在
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
  }

  /**
   * 显示报告
   */
  displayReport() {
    console.log('\n📊 Log Analysis Report'.bold);
    console.log('==================\n');

    // 汇总信息
    console.log('📈 Summary:'.cyan);
    console.log(`   Total Lines: ${this.report.summary.totalLines.toLocaleString()}`);
    console.log(`   Total Errors: ${this.report.summary.totalErrors.toLocaleString()} ${this.report.summary.totalErrors > 0 ? '❌'.red : '✅'.green}`);
    console.log(`   Total Warnings: ${this.report.summary.totalWarnings.toLocaleString()}`);
    console.log(`   Avg Response Time: ${this.report.summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Unique IPs: ${this.report.summary.uniqueIPs.toLocaleString()}`);

    if (this.report.summary.topEndpoint) {
      console.log(`   Top Endpoint: ${this.report.summary.topEndpoint.endpoint} (${this.report.summary.topEndpoint.count} requests)`);
    }

    // 服务详情
    console.log('\n🔍 Services Details:'.cyan);
    Object.entries(this.report.services).forEach(([service, data]) => {
      console.log(`\n${service.toUpperCase()}:`);
      console.log(`   Lines: ${data.lines.toLocaleString()}`);
      console.log(`   Errors: ${data.errors.toLocaleString()} ${data.errors > 0 ? '❌'.red : '✅'.green}`);
      console.log(`   Warnings: ${data.warnings.toLocaleString()}`);
      console.log(`   Avg Response Time: ${data.avgResponseTime.toFixed(2)}ms`);
      console.log(`   P95 Response Time: ${data.p95ResponseTime}ms`);
      console.log(`   Unique IPs: ${data.uniqueIPs.toLocaleString()}`);

      // 状态码分布
      if (Object.keys(data.statusCode).length > 0) {
        console.log('   Status Codes:');
        Object.entries(data.statusCode)
          .sort((a, b) => b[1] - a[1])
          .forEach(([code, count]) => {
            const color = this.getStatusColor(code);
            console.log(`     ${code}: ${count.toLocaleString()}`[color]);
          });
      }

      // 热门端点
      if (data.topEndpoints.length > 0) {
        console.log('   Top Endpoints:');
        data.topEndpoints.slice(0, 5).forEach(([endpoint, count]) => {
          console.log(`     ${endpoint}: ${count} requests`);
        });
      }
    });

    // 错误分析
    const allErrors = Object.values(this.report.services)
      .flatMap(s => s.errors)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allErrors.length > 0) {
      console.log('\n🚨 Recent Errors:'.red);
      allErrors.slice(0, 5).forEach(error => {
        console.log(`   ${error.timestamp} - ${error.message.substring(0, 100)}...`);
      });
    }
  }

  /**
   * 获取状态码颜色
   */
  getStatusColor(code) {
    if (code.startsWith('2')) return 'green';
    if (code.startsWith('3')) return 'yellow';
    if (code.startsWith('4')) return 'red';
    if (code.startsWith('5')) return 'red';
    return 'gray';
  }

  /**
   * 生成HTML报告
   */
  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Log Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .service { margin-bottom: 30px; }
    .service h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .stat { background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-label { font-size: 12px; color: #666; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .error { color: #f44336; }
    .warning { color: #ff9800; }
    .success { color: #4caf50; }
  </style>
</head>
<body>
  <h1>📊 Log Analysis Report</h1>

  <div class="summary">
    <h2>Summary</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total Lines</div>
        <div class="stat-value">${this.report.summary.totalLines.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total Errors</div>
        <div class="stat-value ${this.report.summary.totalErrors > 0 ? 'error' : 'success'}">
          ${this.report.summary.totalErrors.toLocaleString()}
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">Total Warnings</div>
        <div class="stat-value">${this.report.summary.totalWarnings.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Avg Response Time</div>
        <div class="stat-value">${this.report.summary.avgResponseTime.toFixed(2)}ms</div>
      </div>
    </div>
  </div>

  ${Object.entries(this.report.services).map(([service, data]) => `
    <div class="service">
      <h3>${service.toUpperCase()}</h3>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Lines</div>
          <div class="stat-value">${data.lines.toLocaleString()}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Errors</div>
          <div class="stat-value ${data.errors > 0 ? 'error' : 'success'}">${data.errors.toLocaleString()}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Avg Response Time</div>
          <div class="stat-value">${data.avgResponseTime.toFixed(2)}ms</div>
        </div>
        <div class="stat">
          <div class="stat-label">P95 Response Time</div>
          <div class="stat-value">${data.p95ResponseTime}ms</div>
        </div>
      </div>
    </div>
  `).join('')}

  <div style="margin-top: 30px; color: #666; font-size: 12px;">
    Generated at: ${this.report.timestamp}
  </div>
</body>
</html>
`;

    const htmlPath = path.join(this.logDir, 'monitor', 'analysis-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`\n📄 HTML report saved to: ${htmlPath}`);
  }
}

// 命令行接口
if (require.main === module) {
  const analyzer = new LogAnalyzer();

  const args = process.argv.slice(2);
  const generateHTML = args.includes('--html');

  analyzer.analyze().then(() => {
    if (generateHTML) {
      analyzer.generateHTMLReport();
    }
  });
}

module.exports = LogAnalyzer;