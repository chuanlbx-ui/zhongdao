#!/usr/bin/env node

/**
 * 日志监控服务
 * 实时监控各个服务的日志，检测错误和性能问题
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// 简单的颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

String.prototype.red = function() { return colors.red(this); };
String.prototype.yellow = function() { return colors.yellow(this); };
String.prototype.green = function() { return colors.green(this); };
String.prototype.blue = function() { return colors.blue(this); };
String.prototype.gray = function() { return colors.gray(this); };

const config = {
  logDir: process.env.LOG_DIR || './logs',
  alertThreshold: parseInt(process.env.ALERT_THRESHOLD) || 10,
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 5000,
  services: ['api', 'h5', 'admin'],
  errorPatterns: [
    /error/i,
    /exception/i,
    /failed/i,
    /timeout/i,
    /crashed/i,
    /panic/i,
    /fatal/i
  ],
  performancePatterns: [
    /slow/i,
    /timeout/i,
    /memory/i,
    /heap/i
  ]
};

class LogMonitor {
  constructor() {
    this.errorCounts = {};
    this.performanceIssues = {};
    this.logWatchers = {};
    this.alertBuffer = [];
    this.initializeLogDirectories();
    this.startMonitoring();
  }

  /**
   * 初始化日志目录
   */
  initializeLogDirectories() {
    config.services.forEach(service => {
      const serviceLogDir = path.join(config.logDir, service);
      if (!fs.existsSync(serviceLogDir)) {
        fs.mkdirSync(serviceLogDir, { recursive: true });
        console.log(`✅ Created log directory: ${serviceLogDir}`);
      }
    });

    // 创建监控日志目录
    const monitorLogDir = path.join(config.logDir, 'monitor');
    if (!fs.existsSync(monitorLogDir)) {
      fs.mkdirSync(monitorLogDir, { recursive: true });
    }

    // 创建日志文件
    this.createLogFile('error-alerts.log');
    this.createLogFile('performance.log');
  }

  createLogFile(filename) {
    const filePath = path.join(config.logDir, 'monitor', filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
    }
  }

  /**
   * 启动监控
   */
  startMonitoring() {
    console.log('🔍 Starting log monitor...');
    console.log(`📁 Log directory: ${config.logDir}`);
    console.log(`⚠️  Error alert threshold: ${config.alertThreshold} errors/minute`);
    console.log(`⏱️  Check interval: ${config.checkInterval}ms`);

    // 监控每个服务
    config.services.forEach(service => {
      this.watchServiceLogs(service);
    });

    // 定期检查错误率
    setInterval(() => {
      this.checkErrorRates();
    }, config.checkInterval);

    console.log('✅ Log monitor started successfully');
  }

  /**
   * 监控服务日志
   */
  watchServiceLogs(service) {
    const logFile = path.join(config.logDir, service, 'combined.log');

    // 如果日志文件不存在，创建空文件
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '');
    }

    // Windows下使用PowerShell的Get-Content
    const tailCommand = process.platform === 'win32'
      ? 'powershell'
      : 'tail';

    const tailArgs = process.platform === 'win32'
      ? ['-Command', `Get-Content -Path "${logFile}" -Wait -Tail 0`]
      : ['-f', '-n', '0', logFile];

    // 使用tail -f监听日志
    const tail = spawn(tailCommand, tailArgs);

    // 处理Windows下PowerShell的输出
    const rl = readline.createInterface({
      input: tail.stdout.setEncoding('utf8')
    });

    let errorCount = 0;
    let lastResetTime = Date.now();

    rl.on('line', (line) => {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        service,
        level: this.extractLogLevel(line),
        message: line
      };

      // 检测错误
      if (this.isError(line)) {
        errorCount++;
        this.handleError(logEntry, errorCount);
      }

      // 检测性能问题
      if (this.isPerformanceIssue(line)) {
        this.handlePerformanceIssue(logEntry);
      }

      // 特殊处理：追踪请求链路
      this.trackRequest(logEntry);
    });

    // 每分钟重置错误计数
    setInterval(() => {
      errorCount = 0;
      lastResetTime = Date.now();
    }, 60000);

    this.logWatchers[service] = {
      tail,
      rl,
      errorCount: 0
    };

    console.log(`📝 Watching logs for ${service}: ${logFile}`);

    // 处理进程错误
    tail.on('error', (err) => {
      console.error(`Error watching ${service} logs:`, err);
    });
  }

  /**
   * 提取日志级别
   */
  extractLogLevel(line) {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    for (const level of levels) {
      if (line.toUpperCase().includes(level)) {
        return level;
      }
    }
    return 'INFO';
  }

  /**
   * 判断是否为错误日志
   */
  isError(line) {
    return config.errorPatterns.some(pattern => pattern.test(line));
  }

  /**
   * 判断是否为性能问题
   */
  isPerformanceIssue(line) {
    return config.performancePatterns.some(pattern => pattern.test(line));
  }

  /**
   * 处理错误
   */
  handleError(logEntry, errorCount) {
    // 记录错误
    this.appendToLogFile('error-alerts.log',
      `[${logEntry.timestamp}] [${logEntry.service}] ERROR: ${logEntry.message}`
    );

    // 错误计数
    if (!this.errorCounts[logEntry.service]) {
      this.errorCounts[logEntry.service] = 0;
    }
    this.errorCounts[logEntry.service]++;

    // 检查是否超过阈值
    if (errorCount >= config.alertThreshold) {
      this.sendAlert(`${logEntry.service} service error threshold exceeded: ${errorCount} errors in last minute`);
    }

    // 控制台输出
    console.error(`❌ [${logEntry.service}] ${logEntry.message}`);
  }

  /**
   * 处理性能问题
   */
  handlePerformanceIssue(logEntry) {
    this.appendToLogFile('performance.log',
      `[${logEntry.timestamp}] [${logEntry.service}] PERFORMANCE: ${logEntry.message}`
    );

    console.warn(`⚠️  [${logEntry.service}] Performance issue: ${logEntry.message}`);
  }

  /**
   * 追踪请求链路
   */
  trackRequest(logEntry) {
    // 提取请求ID
    const requestIdMatch = logEntry.message.match(/request-id:\s*([a-zA-Z0-9-]+)/i);
    if (requestIdMatch) {
      const requestId = requestIdMatch[1];
      // 这里可以实现请求链路追踪
    }
  }

  /**
   * 检查错误率
   */
  checkErrorRates() {
    const servicesWithErrors = Object.entries(this.errorCounts)
      .filter(([_, count]) => count > 0);

    if (servicesWithErrors.length > 0) {
      console.log(`\n📊 Error rates in last ${config.checkInterval / 1000}s:`);
      servicesWithErrors.forEach(([service, count]) => {
        console.log(`   ${service}: ${count} errors`);
      });
    }
  }

  /**
   * 追加到日志文件
   */
  appendToLogFile(filename, content) {
    const filePath = path.join(config.logDir, 'monitor', filename);
    fs.appendFileSync(filePath, content + '\n');
  }

  /**
   * 发送告警
   */
  sendAlert(message) {
    const timestamp = new Date().toISOString();
    const alertMessage = `[${timestamp}] 🚨 ALERT: ${message}`;

    // 记录告警
    this.appendToLogFile('error-alerts.log', alertMessage);

    // 控制台高亮显示
    console.log('\n' + alertMessage.red + '\n');
  }

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    const status = {};
    config.services.forEach(service => {
      status[service] = {
        errors: this.errorCounts[service] || 0,
        lastCheck: new Date().toISOString()
      };
    });
    return status;
  }

  /**
   * 优雅关闭
   */
  shutdown() {
    console.log('\n🔄 Shutting down log monitor...');

    Object.values(this.logWatchers).forEach(watcher => {
      if (watcher.tail) {
        try {
          process.platform === 'win32'
            ? spawn('taskkill', ['/PID', watcher.tail.pid, '/F'])
            : watcher.tail.kill();
        } catch (e) {
          // 忽略错误
        }
      }
      if (watcher.rl) {
        watcher.rl.close();
      }
    });

    console.log('✅ Log monitor shutdown complete');
    process.exit(0);
  }
}

// 启动监控
const monitor = new LogMonitor();

// 优雅关闭处理
process.on('SIGINT', () => {
  monitor.shutdown();
});

process.on('SIGTERM', () => {
  monitor.shutdown();
});

// 导出监控器实例（用于外部访问）
module.exports = monitor;