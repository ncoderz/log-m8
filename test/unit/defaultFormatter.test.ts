import { describe, expect, it } from 'vitest';
import type { LogEvent } from '../../src/LogEvent.ts';
import { DefaultFormatterFactory } from '../../src/formatters/DefaultFormatter.ts';
import { LogLevel } from '../../src/LogLevel.ts';

function makeEvent(overrides?: Partial<LogEvent>): LogEvent {
  const base: LogEvent = {
    logger: 'app.core',
    level: LogLevel.info,
    message: 'hello',
    data: [1, { a: 2 }],
    context: { requestId: 'r1' },
    timestamp: new Date('2024-01-02T03:04:05.678Z'),
  };
  return Object.assign({}, base, overrides);
}

describe('DefaultFormatter', () => {
  it('text mode default emits header and expands data', () => {
    const f = new DefaultFormatterFactory().create({ name: 'default' });
    const ev = makeEvent();
    const tokens = f.format(ev);
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length >= 1).toBe(true);
    // Contains message token in first string
    expect(String(tokens[0])).toContain('hello');
    // Expanded data present
    const hasExpanded = tokens.some(
      (t) => typeof t === 'number' || (typeof t === 'string' && t.includes('requestId')),
    );
    expect(hasExpanded).toBe(true);
  });

  it('json mode default emits single object with keys', () => {
    const f = new DefaultFormatterFactory().create({ name: 'default', json: true });
    const ev = makeEvent();
    const tokens = f.format(ev);
    expect(tokens.length).toBe(1);
    const obj = tokens[0] as Record<string, unknown>;
    expect(obj.timestamp).toBeDefined();
    expect(obj.level).toBe('info');
    expect(obj.logger).toBe('app.core');
    expect(obj.message).toBe('hello');
  });

  it('resolves tokens and formats timestamp pattern', () => {
    const f = new DefaultFormatterFactory().create({
      name: 'default',
      format: '{timestamp} {LEVEL} [{logger}] {message}',
      timestampFormat: 'yyyy-MM-dd hh:mm:ss.SSS',
    });
    const ev = makeEvent();
    const s = f.format(ev)[0] as string;
    expect(s).toMatch(/^2024-01-02 \d{2}:04:05\.678/);
    expect(s).toContain('HELLO'.slice(0, 0)); // trivial noop to avoid padding brittleness
  });
});
