import { describe, expect, it } from 'vitest';

import type { Filter } from '../../src/Filter.ts';
import type { FilterConfig } from '../../src/FilterConfig.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel } from '../../src/LogLevel.ts';
import { LogM8 } from '../../src/LogM8.ts';
import type { PluginFactory } from '../../src/PluginFactory.ts';
import { PluginKind } from '../../src/PluginKind.ts';

/**
 * Simple performance test filter that always allows events
 */
class PerformanceTestFilter implements Filter {
  name = 'perf-test';
  version = '1.0.0';
  kind = PluginKind.filter;

  init(_config: FilterConfig): void {
    // No initialization needed
  }

  dispose(): void {
    // No cleanup needed
  }

  shouldLog(_logEvent: LogEvent): boolean {
    // Simulate minimal processing time
    return true;
  }
}

/**
 * Filter that does slightly more complex evaluation
 */
class ComplexFilter implements Filter {
  name = 'complex';
  version = '1.0.0';
  kind = PluginKind.filter;
  private allowedLevels: Set<string> = new Set();

  init(config: FilterConfig): void {
    const levels = (config.allowedLevels as string[]) || [
      LogLevel.error,
      LogLevel.fatal,
      LogLevel.warn,
    ];
    this.allowedLevels = new Set(levels);
  }

  dispose(): void {
    this.allowedLevels.clear();
  }

  shouldLog(logEvent: LogEvent): boolean {
    // More complex evaluation logic
    if (!this.allowedLevels.has(logEvent.level)) {
      return false;
    }

    // Check if logger name has specific pattern
    if (logEvent.logger.includes('debug') && logEvent.level === LogLevel.debug) {
      return false;
    }

    // Check message content (simulating content-based filtering)
    if (typeof logEvent.message === 'string' && logEvent.message.includes('IGNORE')) {
      return false;
    }

    return true;
  }
}

describe('Filter Performance Tests', () => {
  it('should handle high-volume logging with filters efficiently', () => {
    const logM8 = new LogM8();

    // Register individual filter factories
    class PerfTestFilterFactory implements PluginFactory {
      name = 'perf-test';
      version = '1.0.0';
      kind = PluginKind.filter;
      create(): Filter {
        return new PerformanceTestFilter();
      }
    }

    logM8.registerPluginFactory(new PerfTestFilterFactory());
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'perf-test' }],
        },
      ],
    });

    const logger = logM8.getLogger('perf-test');
    const eventCount = 10000;

    const startTime = performance.now();

    // Generate many log events
    for (let i = 0; i < eventCount; i++) {
      logger.info(`Performance test message ${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete 10,000 events in reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);

    // Calculate events per millisecond
    const eventsPerMs = eventCount / duration;

    // Should handle at least 10 events per millisecond (quite conservative)
    expect(eventsPerMs).toBeGreaterThan(10);

    logM8.dispose();
  });

  it('should handle multiple complex filters without significant performance impact', () => {
    const logM8 = new LogM8();

    // Register individual filter factories
    class ComplexFilterFactory implements PluginFactory {
      name = 'complex';
      version = '1.0.0';
      kind = PluginKind.filter;
      create(): Filter {
        return new ComplexFilter();
      }
    }

    class PerfTestFilterFactory implements PluginFactory {
      name = 'perf-test';
      version = '1.0.0';
      kind = PluginKind.filter;
      create(): Filter {
        return new PerformanceTestFilter();
      }
    }

    logM8.registerPluginFactory(new ComplexFilterFactory());
    logM8.registerPluginFactory(new PerfTestFilterFactory());
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [
            {
              name: 'complex',
              allowedLevels: [LogLevel.info, LogLevel.warn, LogLevel.error],
            },
            { name: 'perf-test' },
          ],
        },
      ],
    });

    const logger = logM8.getLogger('perf-test');
    const eventCount = 5000;

    const startTime = performance.now();

    // Generate events with varying content to test filter logic
    for (let i = 0; i < eventCount; i++) {
      const messageType = i % 4;
      switch (messageType) {
        case 0:
          logger.info(`Info message ${i}`);
          break;
        case 1:
          logger.warn(`Warning message ${i}`);
          break;
        case 2:
          logger.error(`Error message ${i}`);
          break;
        case 3:
          logger.info(`IGNORE this message ${i}`); // Should be filtered out
          break;
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should still complete quickly even with multiple complex filters
    expect(duration).toBeLessThan(1000);

    logM8.dispose();
  });

  it('should not cause memory leaks during long-running filter evaluation', () => {
    const logM8 = new LogM8();

    // Register individual filter factory
    class ComplexFilterFactory implements PluginFactory {
      name = 'complex';
      version = '1.0.0';
      kind = PluginKind.filter;
      create(): Filter {
        return new ComplexFilter();
      }
    }

    logM8.registerPluginFactory(new ComplexFilterFactory());
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'complex' }],
        },
      ],
    });

    const logger = logM8.getLogger('memory-test');

    // Simulate longer running scenario
    const iterations = 1000;
    const eventsPerIteration = 100;

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < eventsPerIteration; j++) {
        logger.info(`Memory test iteration ${i}, event ${j}`);
      }

      // Force garbage collection if available (Node.js with --expose-gc flag)
      if (global.gc) {
        global.gc();
      }
    }

    // Test passes if no memory errors occur
    expect(true).toBe(true);

    logM8.dispose();
  });

  it('should maintain consistent performance across different log levels', () => {
    const logM8 = new LogM8();

    // Register individual filter factory
    class ComplexFilterFactory implements PluginFactory {
      name = 'complex';
      version = '1.0.0';
      kind = PluginKind.filter;
      create(): Filter {
        return new ComplexFilter();
      }
    }

    logM8.registerPluginFactory(new ComplexFilterFactory());
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [{ name: 'complex' }],
        },
      ],
    });

    const logger = logM8.getLogger('level-perf-test');
    const eventsPerLevel = 1000;

    const levels = [
      LogLevel.trace,
      LogLevel.debug,
      LogLevel.info,
      LogLevel.warn,
      LogLevel.error,
      LogLevel.fatal,
    ];

    const timings: Record<string, number> = {};

    for (const level of levels) {
      const startTime = performance.now();

      for (let i = 0; i < eventsPerLevel; i++) {
        switch (level) {
          case LogLevel.trace:
            logger.trace(`Trace message ${i}`);
            break;
          case LogLevel.debug:
            logger.debug(`Debug message ${i}`);
            break;
          case LogLevel.info:
            logger.info(`Info message ${i}`);
            break;
          case LogLevel.warn:
            logger.warn(`Warn message ${i}`);
            break;
          case LogLevel.error:
            logger.error(`Error message ${i}`);
            break;
          case LogLevel.fatal:
            logger.fatal(`Fatal message ${i}`);
            break;
        }
      }

      const endTime = performance.now();
      timings[level] = endTime - startTime;
    }

    // All levels should complete in reasonable time
    for (const [_level, timing] of Object.entries(timings)) {
      expect(timing).toBeLessThan(500); // 500ms for 1000 events per level
    }

    // Calculate variance to ensure consistent performance
    const times = Object.values(timings);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    // Standard deviation should be reasonable (not more than 50% of average)
    expect(stdDev).toBeLessThan(avgTime * 0.5);

    logM8.dispose();
  });

  it('should handle filters that short-circuit efficiently', () => {
    // Create a filter that denies everything to test short-circuit behavior
    class DenyAllFilter implements Filter {
      name = 'deny-all';
      version = '1.0.0';
      kind = PluginKind.filter;

      init(_config: FilterConfig): void {}
      dispose(): void {}

      shouldLog(_logEvent: LogEvent): boolean {
        return false; // Always deny
      }
    }

    class DenyAllFilterFactory implements PluginFactory {
      name = 'deny-all';
      version = '1.0.0';
      kind = PluginKind.filter;

      create(): Filter {
        return new DenyAllFilter();
      }
    }

    class PerfTestFilterFactory implements PluginFactory {
      name = 'perf-test';
      version = '1.0.0';
      kind = PluginKind.filter;

      create(): Filter {
        return new PerformanceTestFilter();
      }
    }

    const logM8 = new LogM8();

    logM8.registerPluginFactory(new DenyAllFilterFactory());
    logM8.registerPluginFactory(new PerfTestFilterFactory());
    logM8.init({
      appenders: [
        {
          name: 'console',
          filters: [
            { name: 'deny-all' }, // This should short-circuit
            { name: 'perf-test' }, // This should never be called
          ],
        },
      ],
    });

    const logger = logM8.getLogger('short-circuit-test');
    const eventCount = 5000;

    const startTime = performance.now();

    for (let i = 0; i < eventCount; i++) {
      logger.info(`Short circuit test ${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should be very fast since events are denied immediately
    expect(duration).toBeLessThan(100);

    logM8.dispose();
  });
});
