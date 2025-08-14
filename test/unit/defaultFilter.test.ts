import { describe, expect, it } from 'vitest';

import { type DefaultFilterConfig, DefaultFilterFactory } from '../../src/filters/DefaultFilter.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
import { LogLevel } from '../../src/LogLevel.ts';

const baseEvent = (): LogEvent => ({
  logger: 'app.service',
  level: LogLevel.info,
  message: 'msg',
  data: [],
  context: {},
  timestamp: new Date('2025-08-14T10:00:00Z'),
});

describe('DefaultFilter', () => {
  it('allows all when no rules provided', () => {
    const f = new DefaultFilterFactory().create({ name: 'default-filter' } as DefaultFilterConfig);
    expect(f.shouldLog(baseEvent())).toBe(true);
  });

  it('applies allow with AND semantics', () => {
    const f = new DefaultFilterFactory().create({
      name: 'default-filter',
      allow: { logger: 'app.service', level: LogLevel.info },
    });

    expect(f.shouldLog(baseEvent())).toBe(true);
    expect(
      f.shouldLog({
        ...baseEvent(),
        logger: 'other',
      }),
    ).toBe(false);
  });

  it('applies deny with OR semantics and precedence', () => {
    const f = new DefaultFilterFactory().create({
      name: 'default-filter',
      allow: { logger: 'app.service' },
      deny: { 'context.userId': 'blocked' },
    });

    expect(
      f.shouldLog({
        ...baseEvent(),
        context: { userId: 'blocked' },
      }),
    ).toBe(false);

    expect(
      f.shouldLog({
        ...baseEvent(),
        context: { userId: 'ok' },
      }),
    ).toBe(true);
  });

  it('supports bracket notation in paths', () => {
    const f = new DefaultFilterFactory().create({
      name: 'default-filter',
      allow: { 'data[0].custom[3].path': 4 },
    });

    const e: LogEvent = {
      ...baseEvent(),
      data: [
        {
          custom: [{}, {}, {}, { path: 4 }],
        },
      ],
    };

    expect(f.shouldLog(e)).toBe(true);
  });

  it('uses deep equality for objects and arrays', () => {
    const f = new DefaultFilterFactory().create({
      name: 'default-filter',
      allow: { 'context.meta': { a: 1, b: [1, 2, 3] } },
      deny: { 'data[0]': { x: 1 } },
    });

    // Allowed via deep equality on context
    expect(
      f.shouldLog({
        ...baseEvent(),
        context: { meta: { a: 1, b: [1, 2, 3] } },
      }),
    ).toBe(true);

    // Denied via deep equality on data[0]
    expect(
      f.shouldLog({
        ...baseEvent(),
        data: [{ x: 1 }],
      }),
    ).toBe(false);
  });
});
