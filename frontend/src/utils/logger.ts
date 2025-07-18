/**
 * Enterprise-level logging system for Waverider
 * @module utils/logger
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

export interface LogEntry {
  timestamp: string;
  level: LogLevelType;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevelType;
  enableConsole: boolean;
  enableStorage: boolean;
  maxEntries: number;
  context?: string;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxEntries: 1000,
      ...config,
    };
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: string): void {
    this.log(LogLevel.ERROR, message, undefined, context, error);
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error, context?: string): void {
    this.log(LogLevel.FATAL, message, undefined, context, error);
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevelType,
    message: string,
    data?: any,
    context?: string,
    error?: Error
  ): void {
    if (level < this.config.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || this.config.context,
      data,
      error,
    };

    // Add to internal logs
    this.logs.push(entry);
    if (this.logs.length > this.config.maxEntries) {
      this.logs.shift();
    }

    // Console output
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Storage
    if (this.config.enableStorage) {
      this.writeToStorage(entry);
    }
  }

  /**
   * Write log entry to console with appropriate styling
   */
  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const levelStr = Object.keys(LogLevel).find(key => LogLevel[key as keyof typeof LogLevel] === entry.level)?.padEnd(5) || 'UNKNOWN';
    const context = entry.context ? `[${entry.context}]` : '';
    
    const message = `${timestamp} ${levelStr} ${context} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.error || entry.data);
        break;
    }
  }

  /**
   * Write log entry to storage
   */
  private writeToStorage(entry: LogEntry): void {
    try {
      const stored = localStorage.getItem('waverider_logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push(entry);
      
      // Keep only last 100 entries in storage
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('waverider_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write log to storage:', error);
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    localStorage.removeItem('waverider_logs');
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevelType): void {
    this.config.level = level;
  }

  /**
   * Create a child logger with context
   */
  child(context: string): Logger {
    return new Logger({
      ...this.config,
      context: this.config.context ? `${this.config.context}.${context}` : context,
    });
  }
}

// Create default logger instance
export const logger = new Logger({
  level: LogLevel.INFO,
  context: 'waverider',
});

// Export convenience methods
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const fatal = logger.fatal.bind(logger); 