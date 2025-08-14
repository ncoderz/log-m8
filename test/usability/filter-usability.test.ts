import { Enum } from '@ncoderz/superenum';
import { describe, expect, it } from 'vitest';

import type { Filter } from '../../src/Filter.ts';
import type { FilterConfig } from '../../src/FilterConfig.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel, type LogLevelType } from '../../src/LogLevel.ts';
import { LogM8 } from '../../src/LogM8.ts';
import type { PluginFactory } from '../../src/PluginFactory.ts';
import { PluginKind } from '../../src/PluginKind.ts';

describe('Filter Usability Tests', () => {
  it('should have an intuitive interface for basic filtering', () => {
    // A developer should be able to create a simple filter easily
    class SimpleFilter implements Filter {
      name = 'simple';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;

      init(_config: FilterConfig): void {
        // Simple filters may not need complex initialization
      }

      dispose(): void {
        // Simple cleanup
      }

      filter(logEvent: LogEvent): boolean {
        // Intuitive: return true to allow, false to deny
        return logEvent.level !== LogLevel.debug;
      }
    }

    const filter = new SimpleFilter();

    // Interface should be straightforward to use
    expect(filter.name).toBe('simple');
    expect(filter.version).toBe('1.0.0');
    expect(filter.kind).toBe(PluginKind.filter);

    // filter should be easy to understand
    const debugEvent: LogEvent = {
      logger: 'test',
      level: LogLevel.debug,
      message: 'debug message',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    const infoEvent: LogEvent = {
      logger: 'test',
      level: LogLevel.info,
      message: 'info message',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    expect(filter.filter(debugEvent)).toBe(false); // Clear: debug is filtered
    expect(filter.filter(infoEvent)).toBe(true); // Clear: info is allowed
  });

  it('should support common filtering patterns with minimal code', () => {
    // Level-based filtering should be simple
    class LevelFilter implements Filter {
      name = 'level';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;
      private minLevel: LogLevelType = LogLevel.info;

      init(config: FilterConfig): void {
        const lvl = (config as Record<string, unknown>).level;
        if (typeof lvl === 'string') {
          const resolved = Enum(LogLevel).fromValue(lvl);
          if (resolved) this.minLevel = resolved;
        }
      }

      dispose(): void {}

      filter(logEvent: LogEvent): boolean {
        const levels: LogLevelType[] = [
          LogLevel.fatal,
          LogLevel.error,
          LogLevel.warn,
          LogLevel.info,
          LogLevel.debug,
          LogLevel.track,
          LogLevel.trace,
        ];
        const validEventLevel = Enum(LogLevel).fromValue(logEvent.level) ?? LogLevel.trace;
        const validMinLevel = Enum(LogLevel).fromValue(this.minLevel) ?? LogLevel.info;
        const eventIndex = levels.indexOf(validEventLevel);
        const minIndex = levels.indexOf(validMinLevel);
        return eventIndex <= minIndex;
      }
    }

    // Logger name filtering should be simple
    class LoggerFilter implements Filter {
      name = 'logger';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;
      private pattern = '';

      init(config: FilterConfig): void {
        if (config.pattern) {
          this.pattern = config.pattern as string;
        }
      }

      dispose(): void {}

      filter(logEvent: LogEvent): boolean {
        return logEvent.logger.includes(this.pattern);
      }
    }

    const levelFilter = new LevelFilter();
    levelFilter.init({ name: 'level', level: LogLevel.warn });

    const loggerFilter = new LoggerFilter();
    loggerFilter.init({ name: 'logger', pattern: 'app.' });

    const testEvent: LogEvent = {
      logger: 'app.service',
      level: LogLevel.error,
      message: 'test',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    // Both filters should work intuitively
    expect(levelFilter.filter(testEvent)).toBe(true); // error >= warn
    expect(loggerFilter.filter(testEvent)).toBe(true); // 'app.service' includes 'app.'
  });

  it('should provide clear configuration patterns', () => {
    // Configuration should be intuitive and type-safe where possible
    class ConfigurableFilter implements Filter {
      name = 'configurable';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;
      private config: Record<string, unknown> = {};

      init(config: FilterConfig): void {
        // Simple assignment - no complex parsing needed
        this.config = { ...config };
      }

      dispose(): void {}

      filter(_logEvent: LogEvent): boolean {
        // Config should be easily accessible
        return this.config.enabled !== false;
      }
    }

    const filter = new ConfigurableFilter();

    // Configuration should be straightforward
    const simpleConfig: FilterConfig = {
      name: 'test',
      enabled: true,
      customOption: 'value',
    };

    expect(() => filter.init(simpleConfig)).not.toThrow();
    expect(filter.filter({} as LogEvent)).toBe(true);

    // Disabling should be intuitive
    filter.init({ name: 'test', enabled: false });
    expect(filter.filter({} as LogEvent)).toBe(false);
  });

  it('should integrate easily with LogM8', () => {
    // Creating and using filters in LogM8 should be straightforward
    class EasyFilter implements Filter {
      name = 'easy';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;

      init(_config: FilterConfig): void {}
      dispose(): void {}

      filter(logEvent: LogEvent): boolean {
        return !String(logEvent.message).includes('skip');
      }
    }

    class EasyFilterFactory implements PluginFactory {
      name = 'easy';
      version = '1.0.0';
      kind = PluginKind.filter;

      create(_config: FilterConfig): Filter {
        return new EasyFilter();
      }
    }

    const logM8 = new LogM8();
    const filterFactory = new EasyFilterFactory();

    // Registration should be simple
    logM8.registerPluginFactory(filterFactory);

    // Configuration should be intuitive
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'easy' }], // Simple reference by name
        },
      ],
    });

    const logger = logM8.getLogger('test');

    // Usage should be transparent to the end user
    logger.info('normal message'); // Should work
    logger.info('skip this message'); // Should be filtered

    logM8.dispose();
  });

  it('should provide helpful defaults for common use cases', () => {
    // Filters should work with minimal configuration
    class DefaultsFilter implements Filter {
      name = 'defaults';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true; // Sensible default

      init(config: FilterConfig): void {
        // Provide reasonable defaults
        this.enabled = config.enabled !== false; // Default to enabled
      }

      dispose(): void {}

      filter(_logEvent: LogEvent): boolean {
        return this.enabled;
      }
    }

    const filter = new DefaultsFilter();

    // Should work with minimal config
    filter.init({ name: 'test' });
    expect(filter.filter({} as LogEvent)).toBe(true);

    // But still allow customization
    filter.init({ name: 'test', enabled: false });
    expect(filter.filter({} as LogEvent)).toBe(false);
  });

  it('should handle edge cases gracefully', () => {
    // Filters should be robust to unexpected input
    class RobustFilter implements Filter {
      name = 'robust';
      version = '1.0.0';

      enabled = true;
      kind = PluginKind.filter;

      init(_config: FilterConfig): void {}
      dispose(): void {}

      filter(logEvent: LogEvent): boolean {
        try {
          // Defensive programming - handle any input gracefully
          if (!logEvent || typeof logEvent !== 'object') {
            return false;
          }

          if (!logEvent.level || !logEvent.logger) {
            return false;
          }

          return true;
        } catch {
          // If anything goes wrong, err on the side of caution
          return false;
        }
      }
    }

    const filter = new RobustFilter();

    // Should handle various edge cases
    expect(filter.filter(null as unknown as LogEvent)).toBe(false);
    expect(filter.filter(undefined as unknown as LogEvent)).toBe(false);
    expect(filter.filter('string' as unknown as LogEvent)).toBe(false);
    expect(filter.filter({} as LogEvent)).toBe(false);

    // But work normally with valid input
    const validEvent: LogEvent = {
      logger: 'test',
      level: LogLevel.info,
      message: 'test',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    expect(filter.filter(validEvent)).toBe(true);
  });

  it('should support composition and chaining patterns', () => {
    // Multiple filters should work together intuitively
    class ComposableFilter implements Filter {
      name = 'composable';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;
      private allowFunction: (event: LogEvent) => boolean = () => true;

      constructor(allowFn?: (event: LogEvent) => boolean) {
        if (allowFn) {
          this.allowFunction = allowFn;
        }
      }

      init(_config: FilterConfig): void {}
      dispose(): void {}

      filter(logEvent: LogEvent): boolean {
        return this.allowFunction(logEvent);
      }
    }

    // Composing filters should be intuitive
    const levelFilter = new ComposableFilter(
      (event) => event.level === LogLevel.error || event.level === LogLevel.fatal,
    );

    const loggerFilter = new ComposableFilter((event) => event.logger.startsWith('app.'));

    const testEvent: LogEvent = {
      logger: 'app.service',
      level: LogLevel.error,
      message: 'test',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    const wrongLevelEvent: LogEvent = {
      ...testEvent,
      level: LogLevel.debug,
    };

    const wrongLoggerEvent: LogEvent = {
      ...testEvent,
      logger: 'other.service',
    };

    // Each filter should work as expected
    expect(levelFilter.filter(testEvent)).toBe(true);
    expect(levelFilter.filter(wrongLevelEvent)).toBe(false);

    expect(loggerFilter.filter(testEvent)).toBe(true);
    expect(loggerFilter.filter(wrongLoggerEvent)).toBe(false);
  });

  it('should provide clear error messages for common mistakes', () => {
    // Common mistakes should be easy to identify and fix
    class HelpfulFilter implements Filter {
      name = 'helpful';
      version = '1.0.0';
      kind = PluginKind.filter;

      enabled = true;
      private requiredField?: string;

      init(config: FilterConfig): void {
        // Validate configuration and provide helpful errors
        if (!config.requiredField) {
          throw new Error(
            'HelpfulFilter requires "requiredField" in configuration. ' +
              'Example: { name: "helpful", requiredField: "value" }',
          );
        }
        this.requiredField = config.requiredField as string;
      }

      dispose(): void {}

      filter(_logEvent: LogEvent): boolean {
        return Boolean(this.requiredField);
      }
    }

    const filter = new HelpfulFilter();

    // Should provide clear error for missing configuration
    expect(() => filter.init({ name: 'test' })).toThrow(/requires "requiredField"/);

    // Should work with proper configuration
    expect(() => filter.init({ name: 'test', requiredField: 'value' })).not.toThrow();
  });
});
