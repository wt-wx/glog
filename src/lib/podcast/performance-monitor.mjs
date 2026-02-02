import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'src/data', 'podcast-logs');
const METRICS_FILE = path.join(process.cwd(), 'src/data', 'podcast-metrics.json');

export class PerformanceMonitor {
  constructor(options = {}) {
    this.metrics = {
      conversions: [],
      errors: [],
      performance: {},
      system: {}
    };
    this.startTime = Date.now();
    this.options = {
      logLevel: options.logLevel || 'info',
      persistLogs: options.persistLogs !== false,
      enableMetrics: options.enableMetrics !== false,
      ...options
    };
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
      console.error('[Performance Monitor] 创建日志目录失败:', error);
    }
  }

  async log(level, category, message, data = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data
    };

    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    if (this.options.persistLogs) {
      await this.persistLog(logEntry);
    }
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.options.logLevel] || 1;
    const messageLevel = levels[level] || 1;
    return messageLevel >= currentLevel;
  }

  async persistLog(logEntry) {
    try {
      await this.ensureLogDirectory();
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(LOG_DIR, `${date}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('[Performance Monitor] 持久化日志失败:', error);
    }
  }

  async startTimer(operation, metadata = {}) {
    const timerKey = `${operation}_${Date.now()}`;
    this.activeTimers = this.activeTimers || {};
    this.activeTimers[timerKey] = {
      startTime: Date.now(),
      metadata
    };
    return timerKey;
  }

  async endTimer(timerKey) {
    if (!this.activeTimers || !this.activeTimers[timerKey]) {
      console.warn('[Performance Monitor] 未找到计时器:', timerKey);
      return null;
    }

    const timer = this.activeTimers[timerKey];
    const duration = Date.now() - timer.startTime;
    
    const operation = timerKey.split('_')[0];
    
    await this.log('info', 'performance', `操作完成: ${operation}`, {
      duration: `${duration}ms`,
      ...timer.metadata
    });

    const result = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata: timer.metadata
    };

    delete this.activeTimers[timerKey];
    return result;
  }

  async trackConversion(conversionId, stage, status, data = {}) {
    const timestamp = new Date().toISOString();
    const trackingData = {
      conversionId,
      stage,
      status,
      timestamp,
      ...data
    };

    this.metrics.conversions.push(trackingData);

    await this.log('info', 'conversion', `转换阶段: ${stage} - ${status}`, data);

    if (this.options.enableMetrics) {
      await this.updateMetrics();
    }

    return trackingData;
  }

  async trackError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    };

    this.metrics.errors.push(errorData);

    await this.log('error', 'system', `发生错误: ${error.message}`, {
      errorName: error.name,
      ...context
    });

    if (this.options.enableMetrics) {
      await this.updateMetrics();
    }

    return errorData;
  }

  async updateMetrics() {
    try {
      const metricsData = {
        lastUpdated: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        conversions: {
          total: this.metrics.conversions.length,
          successful: this.metrics.conversions.filter(c => c.status === 'completed').length,
          failed: this.metrics.conversions.filter(c => c.status === 'failed').length
        },
        errors: {
          total: this.metrics.errors.length,
          recent: this.metrics.errors.slice(-10)
        },
        performance: this.calculatePerformanceMetrics()
      };

      await fs.writeFile(METRICS_FILE, JSON.stringify(metricsData, null, 2));
    } catch (error) {
      console.error('[Performance Monitor] 更新指标失败:', error);
    }
  }

  calculatePerformanceMetrics() {
    const recentConversions = this.metrics.conversions.slice(-20);
    const durations = recentConversions
      .filter(c => c.data && c.data.duration)
      .map(c => c.data.duration);

    if (durations.length === 0) {
      return {
        averageConversionTime: 0,
        medianConversionTime: 0,
        minConversionTime: 0,
        maxConversionTime: 0
      };
    }

    const sortedDurations = durations.sort((a, b) => a - b);
    const sum = durations.reduce((acc, val) => acc + val, 0);
    const average = sum / durations.length;
    const median = sortedDurations[Math.floor(durations.length / 2)];

    return {
      averageConversionTime: Math.round(average),
      medianConversionTime: median,
      minConversionTime: Math.min(...durations),
      maxConversionTime: Math.max(...durations)
    };
  }

  async getMetrics() {
    try {
      const content = await fs.readFile(METRICS_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async getConversionStats(conversionId) {
    const conversionEvents = this.metrics.conversions.filter(
      c => c.conversionId === conversionId
    );

    if (conversionEvents.length === 0) {
      return null;
    }

    const duration = this.calculateConversionDuration(conversionEvents);
    const stages = this.groupStages(conversionEvents);

    return {
      conversionId,
      stages,
      duration,
      status: conversionEvents[conversionEvents.length - 1].status,
      timeline: conversionEvents
    };
  }

  calculateConversionDuration(events) {
    if (events.length < 2) {
      return 0;
    }

    const start = new Date(events[0].timestamp);
    const end = new Date(events[events.length - 1].timestamp);
    return end - start;
  }

  groupStages(events) {
    const stages = {};

    for (const event of events) {
      if (!stages[event.stage]) {
        stages[event.stage] = {
          startTime: event.timestamp,
          endTime: null,
          duration: null,
          status: event.status,
          attempts: 0
        };
      } else {
        stages[event.stage].endTime = event.timestamp;
        stages[event.stage].duration = new Date(event.timestamp) - new Date(stages[event.stage].startTime);
        stages[event.stage].status = event.status;
        stages[event.stage].attempts++;
      }
    }

    return stages;
  }

  async exportMetrics(format = 'json', startDate = null, endDate = null) {
    let data = this.metrics;

    if (startDate || endDate) {
      const conversions = this.metrics.conversions.filter(c => {
        const date = new Date(c.timestamp);
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      });

      data = { ...this.metrics, conversions };
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      return this.toCSV(data);
    }

    if (format === 'text') {
      return this.toText(data);
    }

    throw new Error(`不支持的导出格式: ${format}`);
  }

  toCSV(data) {
    const headers = ['timestamp', 'category', 'level', 'message'];
    const rows = data.conversions.map(c => [
      c.timestamp,
      'conversion',
      'info',
      `${c.stage} - ${c.status}`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csv;
  }

  toText(data) {
    const lines = [
      `=== 播客转换指标 ===`,
      `总转换次数: ${data.conversions.length}`,
      `成功: ${data.conversions.filter(c => c.status === 'completed').length}`,
      `失败: ${data.conversions.filter(c => c.status === 'failed').length}`,
      `错误总数: ${data.errors.length}`,
      '',
      '=== 性能指标 ===',
      `平均转换时间: ${data.performance.averageConversionTime}ms`,
      `中位数转换时间: ${data.performance.medianConversionTime}ms`,
      '',
      '=== 最近错误 ===',
      ...data.errors.recent.slice(-5).map(e => `${e.timestamp}: ${e.message}`)
    ];

    return lines.join('\n');
  }

  async resetMetrics() {
    this.metrics = {
      conversions: [],
      errors: [],
      performance: {},
      system: {}
    };
    this.startTime = Date.now();

    await this.log('info', 'system', '指标已重置');

    if (this.options.enableMetrics) {
      await this.updateMetrics();
    }
  }

  async clearOldLogs(daysToKeep = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const files = await fs.readdir(LOG_DIR);
      
      for (const file of files) {
        if (!file.endsWith('.log')) {
          continue;
        }

        const filePath = path.join(LOG_DIR, file);
        const stats = await fs.stat(filePath);
        const fileDate = new Date(stats.mtime);

        if (fileDate < cutoffDate) {
          await fs.unlink(filePath);
          await this.log('info', 'system', `删除旧日志: ${file}`);
        }
      }
    } catch (error) {
      console.error('[Performance Monitor] 清理旧日志失败:', error);
    }
  }

  async getHealthStatus() {
    const metrics = await this.getMetrics();
    
    if (!metrics) {
      return {
        status: 'unknown',
        uptime: 0,
        conversions: 0,
        errors: 0
      };
    }

    const errorRate = metrics.errors.total / Math.max(1, metrics.conversions.total);
    const successRate = metrics.conversions.successful / Math.max(1, metrics.conversions.total);

    return {
      status: successRate >= 0.9 ? 'healthy' : successRate >= 0.7 ? 'degraded' : 'unhealthy',
      uptime: metrics.uptime,
      conversions: metrics.conversions.total,
      successRate: `${(successRate * 100).toFixed(1)}%`,
      errorRate: `${(errorRate * 100).toFixed(1)}%`,
      lastError: metrics.errors.recent[metrics.errors.recent.length - 1]?.timestamp || null
    };
  }
}

let globalMonitor = null;

export function getGlobalMonitor(options) {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(options);
  }
  return globalMonitor;
}

export async function log(level, category, message, data) {
  const monitor = getGlobalMonitor();
  await monitor.log(level, category, message, data);
}

export async function trackConversion(conversionId, stage, status, data) {
  const monitor = getGlobalMonitor();
  return await monitor.trackConversion(conversionId, stage, status, data);
}

export async function trackError(error, context) {
  const monitor = getGlobalMonitor();
  return await monitor.trackError(error, context);
}