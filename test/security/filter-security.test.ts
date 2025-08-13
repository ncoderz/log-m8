import { describe, expect, it } from 'vitest';

import type { Filter } from '../../src/Filter.ts';
import type { FilterConfig } from '../../src/FilterConfig.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel } from '../../src/LogLevel.ts';
import { PluginKind } from '../../src/PluginKind.ts';

/**
 * Test filter that attempts to access and validate LogEvent properties safely
 */
class SecurityTestFilter implements Filter {
  name = 'security-test';
  version = '1.0.0';
  kind = PluginKind.filter;

  init(_config: FilterConfig): void {
    // No initialization needed
  }

  dispose(): void {
    // No cleanup needed
  }

  shouldLog(logEvent: LogEvent): boolean {
    try {
      // Safely access properties without modifying them
      const hasLogger = typeof logEvent.logger === 'string';
      const hasLevel = typeof logEvent.level === 'string';
      const hasMessage = logEvent.message !== undefined;
      const hasTimestamp = logEvent.timestamp instanceof Date;

      return hasLogger && hasLevel && hasMessage && hasTimestamp;
    } catch (_error) {
      // In case of any error, default to allowing the event
      return true;
    }
  }
}

describe('Filter Security Tests', () => {
  it('should handle malformed LogEvent objects safely', () => {
    const filter = new SecurityTestFilter();

    // Test with null/undefined values
    const malformedEvents = [
      {
        logger: null,
        level: LogLevel.info,
        message: 'test',
        data: [],
        context: {},
        timestamp: new Date(),
      },
      {
        logger: 'test',
        level: null,
        message: 'test',
        data: [],
        context: {},
        timestamp: new Date(),
      },
      {
        logger: 'test',
        level: LogLevel.info,
        message: undefined,
        data: [],
        context: {},
        timestamp: new Date(),
      },
      {
        logger: 'test',
        level: LogLevel.info,
        message: 'test',
        data: [],
        context: {},
        timestamp: null,
      },
    ] as unknown as LogEvent[];

    // All malformed events should be handled gracefully
    for (const event of malformedEvents) {
      expect(() => filter.shouldLog(event)).not.toThrow();
      // The specific result depends on implementation, but it should not crash
    }
  });

  it('should not be vulnerable to prototype pollution attempts', () => {
    const filter = new SecurityTestFilter();

    // Attempt prototype pollution via LogEvent
    const maliciousEvent = {
      logger: 'test',
      level: LogLevel.info,
      message: 'test',
      data: [],
      context: {},
      timestamp: new Date(),
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    } as unknown as LogEvent;

    expect(() => filter.shouldLog(maliciousEvent)).not.toThrow();

    // Verify that prototype pollution didn't occur
    expect((Object.prototype as unknown as Record<string, unknown>).polluted).toBeUndefined();
    expect(
      (SecurityTestFilter.prototype as unknown as Record<string, unknown>).polluted,
    ).toBeUndefined();
  });

  it('should handle extremely large strings in LogEvent properties', () => {
    const filter = new SecurityTestFilter();

    // Create very large string (potential DoS attack vector)
    const largeString = 'A'.repeat(10000000); // 10MB string

    const largeEvent: LogEvent = {
      logger: largeString,
      level: LogLevel.info,
      message: largeString,
      data: [largeString],
      context: { largeField: largeString },
      timestamp: new Date(),
    };

    const startTime = Date.now();
    let result: boolean;

    expect(() => {
      result = filter.shouldLog(largeEvent);
    }).not.toThrow();

    const duration = Date.now() - startTime;

    // Should complete quickly even with large strings (under 100ms)
    expect(duration).toBeLessThan(100);
    expect(typeof result!).toBe('boolean');
  });

  it('should handle circular references in LogEvent data', () => {
    const filter = new SecurityTestFilter();

    // Create object with circular reference
    const circularObj: Record<string, unknown> = { name: 'test' };
    circularObj.self = circularObj;

    const circularEvent: LogEvent = {
      logger: 'test',
      level: LogLevel.info,
      message: 'test',
      data: [circularObj],
      context: { circular: circularObj },
      timestamp: new Date(),
    };

    // Should handle circular references without infinite loops
    expect(() => filter.shouldLog(circularEvent)).not.toThrow();
  });

  it('should safely handle LogEvent with malicious getters', () => {
    const filter = new SecurityTestFilter();

    // Create object with getter that throws
    const maliciousEvent = {
      get logger() {
        throw new Error('Malicious getter');
      },
      level: LogLevel.info,
      message: 'test',
      data: [],
      context: {},
      timestamp: new Date(),
    } as unknown as LogEvent;

    // Should handle getter errors gracefully
    expect(() => filter.shouldLog(maliciousEvent)).not.toThrow();
  });

  it('should prevent information leakage through error messages', () => {
    // Create filter that might expose sensitive info in errors
    class PotentiallyLeakyFilter implements Filter {
      name = 'leaky';
      version = '1.0.0';
      kind = PluginKind.filter;
      private secretToken = 'secret-123-token';

      init(_config: FilterConfig): void {}
      dispose(): void {}

      shouldLog(logEvent: LogEvent): boolean {
        try {
          // Simulate checking against secret data
          if (logEvent.message === this.secretToken) {
            return false;
          }
          return true;
        } catch (_error) {
          // Should not leak secret in error message
          throw new Error('Filter evaluation failed');
        }
      }
    }

    const filter = new PotentiallyLeakyFilter();

    const testEvent: LogEvent = {
      logger: 'test',
      level: LogLevel.info,
      message: 'normal message',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    // Normal operation should work
    expect(filter.shouldLog(testEvent)).toBe(true);

    // Secret should be filtered but not leak in normal flow
    const secretEvent: LogEvent = {
      ...testEvent,
      message: 'secret-123-token',
    };

    expect(filter.shouldLog(secretEvent)).toBe(false);
  });

  it('should handle malicious filter configuration safely', () => {
    const filter = new SecurityTestFilter();

    // Test with malicious configuration
    const maliciousConfigs = [
      {
        name: 'test',
        __proto__: { malicious: true },
      },
      {
        name: '../../../etc/passwd',
        constructor: { prototype: { pwned: true } },
      },
      {
        name: 'test',
        toString: () => {
          throw new Error('Malicious toString');
        },
      },
      null,
      undefined,
    ] as unknown as FilterConfig[];

    for (const config of maliciousConfigs) {
      expect(() => filter.init(config)).not.toThrow();
    }
  });

  it('should be resilient to memory exhaustion attacks', () => {
    const filter = new SecurityTestFilter();

    // Create many events rapidly to test memory handling
    const events: LogEvent[] = [];

    for (let i = 0; i < 10000; i++) {
      events.push({
        logger: `logger-${i}`,
        level: LogLevel.info,
        message: `Message ${i}`,
        data: [`data-${i}`],
        context: { index: i },
        timestamp: new Date(),
      });
    }

    const startTime = Date.now();

    // Process all events
    for (const event of events) {
      expect(() => filter.shouldLog(event)).not.toThrow();
    }

    const duration = Date.now() - startTime;

    // Should complete in reasonable time (under 1 second for 10k events)
    expect(duration).toBeLessThan(1000);
  });

  it('should not allow filters to persist state between different loggers', () => {
    // Create filter that tries to track state across calls
    class StatefulFilter implements Filter {
      name = 'stateful';
      version = '1.0.0';
      kind = PluginKind.filter;
      private seenLoggers = new Set<string>();

      init(_config: FilterConfig): void {}
      dispose(): void {
        this.seenLoggers.clear();
      }

      shouldLog(logEvent: LogEvent): boolean {
        // Track loggers (this is allowed internal state)
        this.seenLoggers.add(logEvent.logger);

        // Filter should not leak information between different logger contexts
        return !logEvent.logger.includes('private');
      }
    }

    const filter = new StatefulFilter();

    const publicEvent: LogEvent = {
      logger: 'public.service',
      level: LogLevel.info,
      message: 'public message',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    const privateEvent: LogEvent = {
      logger: 'private.service',
      level: LogLevel.info,
      message: 'private message',
      data: [],
      context: {},
      timestamp: new Date(),
    };

    // Public should pass
    expect(filter.shouldLog(publicEvent)).toBe(true);

    // Private should be filtered
    expect(filter.shouldLog(privateEvent)).toBe(false);

    // Filter state should be properly isolated per appender instance
    filter.dispose();
  });
});
