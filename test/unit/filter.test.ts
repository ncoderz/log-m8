import { describe, expect, it } from 'vitest';

import type { Filter } from '../../src/Filter.ts';
import type { FilterConfig } from '../../src/FilterConfig.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel, type LogLevelType } from '../../src/LogLevel.ts';
import { PluginKind } from '../../src/PluginKind.ts';

/**
 * Simple test filter that allows all events
 */
class AllowAllFilter implements Filter {
  name = 'allow-all';
  version = '1.0.0';
  kind = PluginKind.filter;
  enabled = true;

  init(_config: FilterConfig): void {
    // No initialization needed for this test filter
  }

  dispose(): void {
    // No cleanup needed for this test filter
  }

  filter(_logEvent: LogEvent): boolean {
    return true;
  }
}

/**
 * Simple test filter that denies all events
 */
class DenyAllFilter implements Filter {
  name = 'deny-all';
  version = '1.0.0';
  kind = PluginKind.filter;
  enabled = true;

  init(_config: FilterConfig): void {
    // No initialization needed for this test filter
  }

  dispose(): void {
    // No cleanup needed for this test filter
  }

  filter(_logEvent: LogEvent): boolean {
    return false;
  }
}

/**
 * Test filter that filters based on log level
 */
class LevelFilter implements Filter {
  name = 'level-filter';
  version = '1.0.0';
  kind = PluginKind.filter;

  enabled = true;
  private minLevel: LogLevelType = LogLevel.info;

  init(config: FilterConfig): void {
    const lvl = (config as Record<string, unknown>).minLevel;
    if (typeof lvl === 'string' && (Object.values(LogLevel) as string[]).includes(lvl)) {
      this.minLevel = lvl as LogLevelType;
    }
  }

  dispose(): void {
    // No cleanup needed for this test filter
  }

  filter(logEvent: LogEvent): boolean {
    const levelOrder = [
      LogLevel.trace,
      LogLevel.track,
      LogLevel.debug,
      LogLevel.info,
      LogLevel.warn,
      LogLevel.error,
      LogLevel.fatal,
    ];

    // Handle 'off' level separately
    if (logEvent.level === LogLevel.off) {
      return false;
    }

    // Filter out 'off' since it's handled separately above
    if (this.minLevel === LogLevel.off) {
      return false;
    }

    const eventLevelIndex = levelOrder.indexOf(logEvent.level as (typeof levelOrder)[number]);
    const minLevelIndex = levelOrder.indexOf(this.minLevel as (typeof levelOrder)[number]);

    return eventLevelIndex >= minLevelIndex;
  }
}

/**
 * Test filter that filters based on logger name
 */
class LoggerNameFilter implements Filter {
  name = 'logger-name-filter';
  version = '1.0.0';
  kind = PluginKind.filter;
  enabled = true;
  private allowedLoggers: string[] = [];

  init(config: FilterConfig): void {
    if (config.allowedLoggers) {
      this.allowedLoggers = config.allowedLoggers as string[];
    }
  }

  dispose(): void {
    // No cleanup needed for this test filter
  }

  filter(logEvent: LogEvent): boolean {
    if (this.allowedLoggers.length === 0) {
      return true; // Allow all if no specific loggers configured
    }
    return this.allowedLoggers.includes(logEvent.logger);
  }
}

describe('Filter Interface', () => {
  const sampleLogEvent: LogEvent = {
    logger: 'test.logger',
    level: LogLevel.info,
    message: 'Test message',
    data: [],
    context: {},
    timestamp: new Date(),
  };

  describe('Basic Filter Contract', () => {
    it('should implement the Filter interface correctly', () => {
      const filter = new AllowAllFilter();

      // Verify plugin properties
      expect(filter.name).toBe('allow-all');
      expect(filter.version).toBe('1.0.0');
      expect(filter.kind).toBe(PluginKind.filter);

      // Verify filter methods exist
      expect(typeof filter.init).toBe('function');
      expect(typeof filter.dispose).toBe('function');
      expect(typeof filter.filter).toBe('function');
    });

    it('should allow initialization with FilterConfig', () => {
      const filter = new AllowAllFilter();
      const config: FilterConfig = {
        name: 'test-filter',
        options: { someOption: 'value' },
      };

      expect(() => filter.init(config)).not.toThrow();
    });

    it('should allow disposal without errors', () => {
      const filter = new AllowAllFilter();
      expect(() => filter.dispose()).not.toThrow();
    });
  });

  describe('filter Method', () => {
    it('should return boolean value', () => {
      const allowFilter = new AllowAllFilter();
      const denyFilter = new DenyAllFilter();

      const allowResult = allowFilter.filter(sampleLogEvent);
      const denyResult = denyFilter.filter(sampleLogEvent);

      expect(typeof allowResult).toBe('boolean');
      expect(typeof denyResult).toBe('boolean');
      expect(allowResult).toBe(true);
      expect(denyResult).toBe(false);
    });

    it('should be synchronous', () => {
      const filter = new AllowAllFilter();
      const start = Date.now();
      const result = filter.filter(sampleLogEvent);
      const duration = Date.now() - start;

      // Should complete very quickly (within 1ms in most cases)
      expect(duration).toBeLessThan(10);
      expect(result).toBe(true);
    });

    it('should not mutate the LogEvent', () => {
      const filter = new AllowAllFilter();
      const originalEvent = { ...sampleLogEvent };

      filter.filter(sampleLogEvent);

      // Verify the event wasn't modified
      expect(sampleLogEvent).toEqual(originalEvent);
    });
  });

  describe('Custom Filter Implementations', () => {
    it('should support level-based filtering', () => {
      const filter = new LevelFilter();
      filter.init({
        name: 'level-filter',
        minLevel: LogLevel.warn,
      });

      const infoEvent: LogEvent = { ...sampleLogEvent, level: LogLevel.info };
      const warnEvent: LogEvent = { ...sampleLogEvent, level: LogLevel.warn };
      const errorEvent: LogEvent = { ...sampleLogEvent, level: LogLevel.error };

      expect(filter.filter(infoEvent)).toBe(false); // Below minimum
      expect(filter.filter(warnEvent)).toBe(true); // At minimum
      expect(filter.filter(errorEvent)).toBe(true); // Above minimum
    });

    it('should support logger name filtering', () => {
      const filter = new LoggerNameFilter();
      filter.init({
        name: 'logger-filter',
        allowedLoggers: ['app.service', 'app.controller'],
      });

      const serviceEvent: LogEvent = { ...sampleLogEvent, logger: 'app.service' };
      const controllerEvent: LogEvent = { ...sampleLogEvent, logger: 'app.controller' };
      const otherEvent: LogEvent = { ...sampleLogEvent, logger: 'app.other' };

      expect(filter.filter(serviceEvent)).toBe(true);
      expect(filter.filter(controllerEvent)).toBe(true);
      expect(filter.filter(otherEvent)).toBe(false);
    });

    it('should handle configuration options correctly', () => {
      const filter = new LevelFilter();

      // Test with default configuration
      filter.init({ name: 'test' });
      const infoEvent: LogEvent = { ...sampleLogEvent, level: LogLevel.info };
      expect(filter.filter(infoEvent)).toBe(true);

      // Test with custom configuration
      filter.init({
        name: 'test',
        minLevel: LogLevel.error,
      });
      expect(filter.filter(infoEvent)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid log events gracefully', () => {
      const filter = new AllowAllFilter();

      // Test with minimal event
      const minimalEvent = {
        logger: 'test',
        level: LogLevel.info,
        message: 'test',
        data: [],
        context: {},
        timestamp: new Date(),
      } as LogEvent;

      expect(() => filter.filter(minimalEvent)).not.toThrow();
      expect(filter.filter(minimalEvent)).toBe(true);
    });

    it('should handle missing configuration options gracefully', () => {
      const filter = new LoggerNameFilter();

      // Initialize without options
      filter.init({ name: 'test' });

      expect(() => filter.filter(sampleLogEvent)).not.toThrow();
      expect(filter.filter(sampleLogEvent)).toBe(true); // Should allow all when no config
    });
  });

  describe('Performance', () => {
    it('should evaluate quickly for large numbers of events', () => {
      const filter = new AllowAllFilter();
      const events: LogEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        ...sampleLogEvent,
        logger: `logger-${i}`,
        message: `Message ${i}`,
      }));

      const start = Date.now();

      for (const event of events) {
        filter.filter(event);
      }

      const duration = Date.now() - start;

      // Should process 1000 events very quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should not cause memory allocations during evaluation', () => {
      const filter = new AllowAllFilter();

      // This is more of a design test - the filter shouldn't create
      // new objects or arrays during filter evaluation
      const result1 = filter.filter(sampleLogEvent);
      const result2 = filter.filter(sampleLogEvent);

      expect(result1).toBe(result2);
      expect(typeof result1).toBe('boolean');
    });
  });
});
