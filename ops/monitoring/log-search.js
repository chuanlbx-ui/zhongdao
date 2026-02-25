#!/usr/bin/env node

/**
 * 日志搜索工具
 * 用于在日志文件中搜索特定内容
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class LogSearcher {
  constructor() {
    this.logDir = './logs';
    this.colors = require('colors');
  }

  /**
   * 搜索日志
   */
  async search(pattern, options = {}) {
    const {
      service = 'all',
      level = 'all',
      startTime = null,
      endTime = null,
      limit = 100,
      highlight = true
    } = options;

    console.log(`🔍 Searching for pattern: ${pattern.yellow}`);
    console.log(`📁 Services: ${service}`);
    console.log(`📊 Level: ${level}`);
    console.log(`⏰ Time range: ${startTime || 'All'} to ${endTime || 'Now'}`);
    console.log(`📄 Limit: ${limit} results\n`);

    const results = [];

    if (service === 'all') {
      const services = ['api', 'h5', 'admin'];
      for (const svc of services) {
        const serviceResults = await this.searchService(svc, pattern, options);
        results.push(...serviceResults);
      }
    } else {
      const serviceResults = await this.searchService(service, pattern, options);
      results.push(...serviceResults);
    }

    // 应用时间过滤
    const filteredResults = this.filterByTime(results, startTime, endTime);

    // 应用限制
    const limitedResults = filteredResults.slice(0, limit);

    // 显示结果
    this.displayResults(limitedResults, pattern, highlight);

    return limitedResults;
  }

  /**
   * 搜索特定服务日志
   */
  async searchService(service, pattern, options) {
    const logFile = path.join(this.logDir, service, 'combined.log');
    const results = [];

    if (!fs.existsSync(logFile)) {
      console.log(`⚠️  Log file not found: ${logFile}`);
      return results;
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (this.matchesPattern(line, pattern, options)) {
        results.push({
          service,
          line,
          timestamp: this.extractTimestamp(line),
          level: this.extractLevel(line)
        });
      }
    }

    return results;
  }

  /**
   * 检查行是否匹配模式
   */
  matchesPattern(line, pattern, options) {
    const regex = new RegExp(pattern, 'i');

    // 基本模式匹配
    if (!regex.test(line)) {
      return false;
    }

    // 级别过滤
    if (options.level !== 'all') {
      const level = this.extractLevel(line);
      if (level !== options.level) {
        return false;
      }
    }

    return true;
  }

  /**
   * 按时间过滤结果
   */
  filterByTime(results, startTime, endTime) {
    if (!startTime && !endTime) {
      return results;
    }

    const start = startTime ? new Date(startTime) : new Date(0);
    const end = endTime ? new Date(endTime) : new Date();

    return results.filter(result => {
      const timestamp = result.timestamp ? new Date(result.timestamp) : null;
      if (!timestamp) return true;
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * 提取时间戳
   */
  extractTimestamp(line) {
    // 尝试提取各种格式的时间戳
    const patterns = [
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      /\w{3} \d{2} \d{2}:\d{2}:\d{2}/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * 提取日志级别
   */
  extractLevel(line) {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    for (const level of levels) {
      if (line.toUpperCase().includes(level)) {
        return level;
      }
    }
    return 'INFO';
  }

  /**
   * 显示搜索结果
   */
  displayResults(results, pattern, highlight) {
    if (results.length === 0) {
      console.log('No results found\n');
      return;
    }

    console.log(`📊 Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      const { service, line, timestamp, level } = result;

      // 服务名和级别
      const serviceStr = `[${service.toUpperCase()}]`.cyan;
      const levelStr = this.colorizeLevel(level);

      // 时间戳
      const timestampStr = timestamp ? `[${timestamp}] `.gray : '';

      // 高亮匹配内容
      let displayLine = line;
      if (highlight) {
        const regex = new RegExp(`(${pattern})`, 'gi');
        displayLine = line.replace(regex, this.colors.yellow('$1'));
      }

      // 输出
      console.log(`${index + 1}. ${serviceStr} ${levelStr} ${timestampStr}`);
      console.log(`   ${displayLine}\n`);
    });

    // 显示统计信息
    this.displayStatistics(results);
  }

  /**
   * 为日志级别着色
   */
  colorizeLevel(level) {
    switch (level) {
      case 'ERROR':
        return level.red;
      case 'WARN':
        return level.yellow;
      case 'INFO':
        return level.blue;
      case 'DEBUG':
        return level.gray;
      default:
        return level;
    }
  }

  /**
   * 显示统计信息
   */
  displayStatistics(results) {
    const stats = {
      total: results.length,
      byService: {},
      byLevel: {}
    };

    results.forEach(result => {
      // 按服务统计
      if (!stats.byService[result.service]) {
        stats.byService[result.service] = 0;
      }
      stats.byService[result.service]++;

      // 按级别统计
      if (!stats.byLevel[result.level]) {
        stats.byLevel[result.level] = 0;
      }
      stats.byLevel[result.level]++;
    });

    console.log('\n📈 Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log('   By Service:');
    Object.entries(stats.byService).forEach(([service, count]) => {
      console.log(`     ${service}: ${count}`);
    });
    console.log('   By Level:');
    Object.entries(stats.byLevel).forEach(([level, count]) => {
      console.log(`     ${level}: ${count}`);
    });
  }

  /**
   * 实时跟踪日志
   */
  async tail(pattern, options = {}) {
    console.log(`🔄 Real-time log tracking for pattern: ${pattern.yellow}\n`);

    const { spawn } = require('child_process');
    const services = options.service === 'all' ? ['api', 'h5', 'admin'] : [options.service];

    services.forEach(service => {
      const logFile = path.join(this.logDir, service, 'combined.log');
      if (fs.existsSync(logFile)) {
        const tail = spawn('tail', ['-f', '-n', '0', logFile]);
        const rl = readline.createInterface({ input: tail.stdout });

        rl.on('line', line => {
          if (this.matchesPattern(line, pattern, options)) {
            const serviceStr = `[${service.toUpperCase()}]`.cyan;
            const levelStr = this.colorizeLevel(this.extractLevel(line));
            console.log(`${serviceStr} ${levelStr} ${line}`);
          }
        });
      }
    });
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const searcher = new LogSearcher();

  if (args.length === 0) {
    console.log('Usage: node log-search.js <pattern> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --service <name>    Service to search (api, h5, admin, or all)');
    console.log('  --level <level>     Log level (ERROR, WARN, INFO, DEBUG, or all)');
    console.log('  --start <time>      Start time (ISO format)');
    console.log('  --end <time>        End time (ISO format)');
    console.log('  --limit <number>    Limit results (default: 100)');
    console.log('  --no-highlight      Disable highlighting');
    console.log('  --tail              Real-time log tracking');
    console.log('');
    console.log('Examples:');
    console.log('  node log-search.js "database error"');
    console.log('  node log-search.js "timeout" --service api --level ERROR');
    console.log('  node log-search.js "user" --start "2024-01-01" --end "2024-01-02"');
    console.log('  node log-search.js "error" --tail');
    process.exit(1);
  }

  const pattern = args[0];
  const options = {
    service: 'all',
    level: 'all',
    startTime: null,
    endTime: null,
    limit: 100,
    highlight: true,
    tail: false
  };

  // 解析选项
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--service':
        options.service = args[++i];
        break;
      case '--level':
        options.level = args[++i];
        break;
      case '--start':
        options.startTime = args[++i];
        break;
      case '--end':
        options.endTime = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--no-highlight':
        options.highlight = false;
        break;
      case '--tail':
        options.tail = true;
        break;
    }
  }

  if (options.tail) {
    searcher.tail(pattern, options);
  } else {
    searcher.search(pattern, options);
  }
}

module.exports = LogSearcher;