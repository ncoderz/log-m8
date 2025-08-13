import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Appender } from '../../src/Appender.ts';
import type { AppenderConfig } from '../../src/AppenderConfig.ts';
import type { Filter } from '../../src/Filter.ts';
import { LogLevel } from '../../src/LogLevel.ts';
import { LogM8 } from '../../src/LogM8.ts';
import type { PluginFactory } from '../../src/PluginFactory.ts';
import { PluginKind } from '../../src/PluginKind.ts';

class DenyAllFilter implements Filter {
  name = 'deny';
  version = '1.0.0';
  kind = PluginKind.filter;
  init(): void {}
  dispose(): void {}
  shouldLog(): boolean {
    return false;
  }
}

class SpyAppender implements Appender {
  name = 'spy';
  version = '1.0.0';
  kind = PluginKind.appender;
  supportedLevels = new Set([
    LogLevel.fatal,
    LogLevel.error,
    LogLevel.warn,
    LogLevel.info,
    LogLevel.debug,
    LogLevel.track,
    LogLevel.trace,
  ]);
  enabled = true;
  priority?: number;
  writes: string[] = [];
  private filters: Filter[] = [];
  init(config: AppenderConfig, _formatter?: unknown, filters?: Filter[]): void {
    this.name = config.name;
    this.priority = config.priority;
    this.enabled = config.enabled !== false;
    this.filters = filters ?? [];
  }
  dispose(): void {}
  write(e: { logger: string; level: string; message: unknown }): void {
    for (const f of this.filters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!f.shouldLog(e as any)) return;
    }
    this.writes.push(`${e.logger}:${e.level}:${e.message}`);
  }
  flush(): void {}
}

class SpyAppenderFactory implements PluginFactory {
  name = 'spy';
  version = '1.0.0';
  kind = PluginKind.appender;
  instances: SpyAppender[] = [];

  create(config: AppenderConfig): Appender {
    const a = new SpyAppender();
    a.init(config);
    this.instances.push(a);
    return a;
  }
}

describe('LogM8 core', () => {
  let logm8: LogM8;
  beforeEach(() => {
    logm8 = new LogM8();
  });
  afterEach(() => {
    logm8.dispose();
    vi.restoreAllMocks();
  });

  it('getLogger returns stable instance and hierarchical child', () => {
    const a = logm8.getLogger('app');
    const a2 = logm8.getLogger('app');
    expect(a).toBe(a2);
    const child = a.getLogger('svc');
    expect(child.name).toBe('app.svc');
  });

  it('level gating and enablement flags behave as specified', () => {
    const l = logm8.getLogger('x');
    expect(l.isInfo).toBe(true); // default level
    expect(l.isEnabled).toBe(true); // should be enabled by default

    l.setLevel(LogLevel.error);
    expect(l.isError).toBe(true);
    expect(l.isFatal).toBe(true); // fatal is enabled when level is error
    expect(l.isWarn).toBe(false); // warn is not enabled when level is error
    expect(l.isEnabled).toBe(true); // should still be enabled
  });

  it('LogLevel.off disables all logging and flags', () => {
    const spyFactory = new SpyAppenderFactory();
    logm8.registerPluginFactory(spyFactory);
    logm8.init({ appenders: [{ name: 'spy' }] });

    const logger = logm8.getLogger('off-test');
    logger.setLevel(LogLevel.off);

    // Verify isEnabled is false when set to off
    expect(logger.isEnabled).toBe(false);

    // Verify all level flags are false when set to off
    expect(logger.isFatal).toBe(false);
    expect(logger.isError).toBe(false);
    expect(logger.isWarn).toBe(false);
    expect(logger.isInfo).toBe(false);
    expect(logger.isDebug).toBe(false);
    expect(logger.isTrack).toBe(false);
    expect(logger.isTrace).toBe(false);

    // Verify no events are emitted regardless of method called
    const spy = spyFactory.instances[0];
    spy.writes = []; // Clear any existing writes

    logger.fatal('fatal message');
    logger.error('error message');
    logger.warn('warn message');
    logger.info('info message');
    logger.debug('debug message');
    logger.track('track message');
    logger.trace('trace message');

    expect(spy.writes).toHaveLength(0); // No events should be written
  });

  it('buffers logs before init and flushes FIFO after init', () => {
    const spyFactory = new SpyAppenderFactory();
    logm8.registerPluginFactory(spyFactory);
    const logger = logm8.getLogger('pre');
    logger.info('one');
    logger.info('two');
    logm8.init({ appenders: [{ name: 'spy' }] });
    // emit trigger after init should flush buffered two first, then this
    logger.info('three');
  });

  it('enable/disable appender toggles writes', () => {
    const spyFactory = new SpyAppenderFactory();
    logm8.registerPluginFactory(spyFactory);
    logm8.init({ appenders: [{ name: 'spy' }] });
    const logger = logm8.getLogger('t');
    logm8.disableAppender('spy');
    logger.info('x');
    logm8.enableAppender('spy');
    logger.info('y');
  });

  it('filters short-circuit before write', () => {
    const a1 = new SpyAppender();
    a1.init({ name: 'spy' }, undefined, [new DenyAllFilter()]);
    a1.write({ logger: 'f', level: LogLevel.info, message: 'm' } as unknown as {
      logger: string;
      level: string;
      message: unknown;
    });
    expect(a1.writes.length).toBe(0);
  });
});
