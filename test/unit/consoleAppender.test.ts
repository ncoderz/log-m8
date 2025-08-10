import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsoleAppender, ConsoleAppenderFactory } from '../../src/appenders/ConsoleAppender.ts';
import type { Filter } from '../../src/Filter.ts';
import type { Formatter } from '../../src/Formatter.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel } from '../../src/LogLevel.ts';

describe('ConsoleAppender', () => {
  const event: LogEvent = {
    logger: 'a',
    level: LogLevel.info,
    message: 'msg',
    data: [],
    context: {},
    timestamp: new Date(),
  };

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation((() => {}) as unknown as typeof console.info);
    vi.spyOn(console, 'log').mockImplementation((() => {}) as unknown as typeof console.log);
    vi.spyOn(console, 'error').mockImplementation((() => {}) as unknown as typeof console.error);
    vi.spyOn(console, 'warn').mockImplementation((() => {}) as unknown as typeof console.warn);
    vi.spyOn(console, 'debug').mockImplementation((() => {}) as unknown as typeof console.debug);
    vi.spyOn(console, 'trace').mockImplementation((() => {}) as unknown as typeof console.trace);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('factory initializes and appender writes using level method', () => {
    const f = new ConsoleAppenderFactory();
    const a = f.create({ name: 'console' });
    a.write(event);
    expect(console.info).toHaveBeenCalledOnce();
  });

  it('applies formatter tokens when provided', () => {
    const a = new ConsoleAppender();
    const formatter: Formatter = {
      name: 'f',
      version: '1.0.0',
      kind: 'formatter' as never,
      init: () => {},
      dispose: () => {},
      format: () => ['x', 'y'],
    };
    a.init({ name: 'console' }, formatter, []);
    a.write(event);
    expect(console.info).toHaveBeenCalledWith('x', 'y');
  });

  it('short-circuits on filter false', () => {
    const a = new ConsoleAppender();
    const deny: Filter = {
      name: 'deny',
      version: '1.0.0',
      kind: 'filter' as never,
      init: () => {},
      dispose: () => {},
      shouldLog: () => false,
    };
    a.init({ name: 'console' }, undefined, [deny]);
    a.write(event);
    expect(console.info).not.toHaveBeenCalled();
  });
});
