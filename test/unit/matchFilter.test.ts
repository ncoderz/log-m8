import { describe, expect, it } from 'vitest';

import { type MatchFilterConfig, MatchFilterFactory } from '../../src/filters/MatchFilter.ts';
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

describe('MatchFilter', () => {
  it('allows all when no rules provided', () => {
    const f = new MatchFilterFactory().create({ name: 'match-filter' } as MatchFilterConfig);
    expect(f.filter(baseEvent())).toBe(true);
  });

  it('applies allow with AND semantics', () => {
    const f = new MatchFilterFactory().create({
      name: 'match-filter',
      allow: { logger: 'app.service', level: LogLevel.info },
    });

    expect(f.filter(baseEvent())).toBe(true);
    expect(
      f.filter({
        ...baseEvent(),
        logger: 'other',
      }),
    ).toBe(false);
  });

  it('applies deny with OR semantics and precedence', () => {
    const f = new MatchFilterFactory().create({
      name: 'match-filter',
      allow: { logger: 'app.service' },
      deny: { 'context.userId': 'blocked' },
    });

    expect(
      f.filter({
        ...baseEvent(),
        context: { userId: 'blocked' },
      }),
    ).toBe(false);

    expect(
      f.filter({
        ...baseEvent(),
        context: { userId: 'ok' },
      }),
    ).toBe(true);
  });

  it('supports bracket notation in paths', () => {
    const f = new MatchFilterFactory().create({
      name: 'match-filter',
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

    expect(f.filter(e)).toBe(true);
  });

  it('uses deep equality for objects and arrays', () => {
    const f = new MatchFilterFactory().create({
      name: 'match-filter',
      allow: { 'context.meta': { a: 1, b: [1, 2, 3] } },
      deny: { 'data[0]': { x: 1 } },
    });

    // Allowed via deep equality on context
    expect(
      f.filter({
        ...baseEvent(),
        context: { meta: { a: 1, b: [1, 2, 3] } },
      }),
    ).toBe(true);

    // Denied via deep equality on data[0]
    expect(
      f.filter({
        ...baseEvent(),
        data: [{ x: 1 }],
      }),
    ).toBe(false);
  });
});
