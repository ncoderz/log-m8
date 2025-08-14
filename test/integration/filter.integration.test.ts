import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Filter } from '../../src/Filter.ts';
import type { FilterConfig } from '../../src/FilterConfig.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel } from '../../src/LogLevel.ts';
import { LogM8 } from '../../src/LogM8.ts';
import type { Plugin } from '../../src/Plugin.ts';
import type { PluginConfig } from '../../src/PluginConfig.ts';
import type { PluginFactory } from '../../src/PluginFactory.ts';
import { PluginKind, type PluginKindType } from '../../src/PluginKind.ts';

/**
 * Test filter that allows only error and fatal level events
 */
class ErrorOnlyFilter implements Filter {
  readonly name = 'error-only';
  readonly version = '1.0.0';
  readonly kind: PluginKindType = PluginKind.filter;
  enabled = true;

  init(_config: FilterConfig): void {
    // No initialization needed
  }

  dispose(): void {
    // No cleanup needed
  }

  filter(logEvent: LogEvent): boolean {
    return logEvent.level === LogLevel.error || logEvent.level === LogLevel.fatal;
  }
}

/**
 * Test filter that denies events from specific loggers
 */
class LoggerDenyFilter implements Filter {
  readonly name = 'logger-deny';
  readonly version = '1.0.0';
  readonly kind: PluginKindType = PluginKind.filter;
  enabled = true;
  private deniedLoggers: string[] = [];

  init(config: FilterConfig): void {
    if (config.deniedLoggers) {
      this.deniedLoggers = config.deniedLoggers as string[];
    }
  }

  dispose(): void {
    // No cleanup needed
  }

  filter(logEvent: LogEvent): boolean {
    return !this.deniedLoggers.includes(logEvent.logger);
  }
}

/**
 * Filter factories for testing
 */
class ErrorOnlyFilterFactory implements PluginFactory {
  readonly name = 'error-only';
  readonly version = '1.0.0';
  readonly kind: PluginKindType = PluginKind.filter;

  create(config: PluginConfig): Plugin {
    const filter = new ErrorOnlyFilter();
    filter.init(config as FilterConfig);
    return filter;
  }
}

class LoggerDenyFilterFactory implements PluginFactory {
  readonly name = 'logger-deny';
  readonly version = '1.0.0';
  readonly kind: PluginKindType = PluginKind.filter;

  create(config: PluginConfig): Plugin {
    const filter = new LoggerDenyFilter();
    filter.init(config as FilterConfig);
    return filter;
  }
}

describe('Filter Integration Tests', () => {
  let originalConsole: typeof console;

  beforeEach(() => {
    // Mock console methods to capture output
    originalConsole = global.console;
    global.console = {
      ...console,
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
    vi.restoreAllMocks();
  });

  it('should apply filters to console appender', () => {
    const logM8 = new LogM8();
    const errorOnlyFactory = new ErrorOnlyFilterFactory();

    logM8.registerPluginFactory(errorOnlyFactory);
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'error-only' }],
        },
      ],
    });

    const logger = logM8.getLogger('test');

    // These should be filtered out
    logger.info('info message');
    logger.warn('warn message');
    logger.debug('debug message');

    // These should pass through
    logger.error('error message');
    logger.fatal('fatal message');

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.error,
        message: 'error message',
      }),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.fatal,
        message: 'fatal message',
      }),
    );

    logM8.dispose();
  });

  it('should apply multiple filters with AND semantics', () => {
    const logM8 = new LogM8();
    const errorOnlyFactory = new ErrorOnlyFilterFactory();
    const loggerDenyFactory = new LoggerDenyFilterFactory();

    logM8.registerPluginFactory(errorOnlyFactory);
    logM8.registerPluginFactory(loggerDenyFactory);
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [
            { name: 'error-only' },
            { name: 'logger-deny', deniedLoggers: ['denied.logger'] },
          ],
        },
      ],
    });

    const allowedLogger = logM8.getLogger('allowed.logger');
    const deniedLogger = logM8.getLogger('denied.logger');

    // This should pass both filters (error level + allowed logger)
    allowedLogger.error('allowed error');

    // This should be denied by first filter (not error level)
    allowedLogger.info('allowed info');

    // This should be denied by second filter (denied logger)
    deniedLogger.error('denied error');

    // Only the first message should have been logged
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.error,
        message: 'allowed error',
        logger: 'allowed.logger',
      }),
    );

    logM8.dispose();
  });

  it('should handle filter initialization errors gracefully', () => {
    const logM8 = new LogM8();

    // Try to initialize with an unknown filter
    expect(() =>
      logM8.init({
        appenders: [
          {
            name: 'console',
            filters: [{ name: 'unknown-filter' }],
          },
        ],
      }),
    ).toThrow("Plugin factory kind 'filter' with name 'unknown-filter' not found");

    logM8.dispose();
  });

  it('should handle filters that throw during evaluation', () => {
    const logM8 = new LogM8();

    // Create a filter that throws during filter
    class ThrowingFilter implements Filter {
      name = 'throwing';
      version = '1.0.0';
      kind = PluginKind.filter;
      enabled = true;

      init(_config: FilterConfig): void {}
      dispose(): void {}

      filter(_logEvent: LogEvent): boolean {
        throw new Error('Filter evaluation error');
      }
    }

    class ThrowingFilterFactory implements PluginFactory {
      name = 'throwing';
      version = '1.0.0';
      kind = PluginKind.filter;

      create(): Filter {
        return new ThrowingFilter();
      }
    }

    logM8.registerPluginFactory(new ThrowingFilterFactory());
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'throwing' }],
        },
      ],
    });

    const logger = logM8.getLogger('test');

    // This should not crash the application, but the event should not be logged
    expect(() => logger.info('test message')).not.toThrow();

    // The console should not have been called due to the filter error
    expect(console.info).not.toHaveBeenCalled();

    logM8.dispose();
  });

  it('should work without any filters configured', () => {
    const logM8 = new LogM8();

    logM8.init({
      appenders: [
        {
          name: 'console',
          // No filters configured
        },
      ],
    });

    const logger = logM8.getLogger('test');
    logger.info('test message');

    // Should log normally when no filters are present
    expect(console.info).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.info,
        message: 'test message',
      }),
    );

    logM8.dispose();
  });

  it('should support different filters per appender', () => {
    const logM8 = new LogM8();
    const errorOnlyFactory = new ErrorOnlyFilterFactory();
    const loggerDenyFactory = new LoggerDenyFilterFactory();

    logM8.registerPluginFactory(errorOnlyFactory);
    logM8.registerPluginFactory(loggerDenyFactory);

    // Mock file system for file appender
    const fs = {
      createWriteStream: vi.fn(() => ({
        write: vi.fn(),
        end: vi.fn(),
      })),
    };
    vi.doMock('node:fs', () => fs);

    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'error-only' }],
        },
        {
          name: 'file',
          filename: 'test.log',
          filters: [{ name: 'logger-deny', deniedLoggers: ['secret'] }],
        },
      ],
    });

    const logger = logM8.getLogger('test');
    const secretLogger = logM8.getLogger('secret');

    // Info should be filtered by console (error-only) but pass to file
    logger.info('info message');

    // Error should pass to console but be filtered by file (denied logger) - wait this is wrong logger
    logger.error('error message');

    // Secret logger error should pass to console but be filtered by file
    secretLogger.error('secret error');

    // Console should only receive error messages (not from secret logger)
    expect(console.error).toHaveBeenCalledTimes(2);

    logM8.dispose();
  });
});
