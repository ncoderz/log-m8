import { describe, expect, it } from 'vitest';
import { LogM8Utils } from '../../src/LogM8Utils.ts';

describe('LogM8Utils', () => {
  it('getPropertyByPath resolves nested and arrays', () => {
    const o = { a: { b: [{ c: 1 }, 2] } };
    expect(LogM8Utils.getPropertyByPath(o, 'a.b.0.c')).toBe(1);
    expect(LogM8Utils.getPropertyByPath(o, 'a.b.1')).toBe(2);
    expect(LogM8Utils.getPropertyByPath(o, 'a.x')).toBeUndefined();
  });

  it('formatTimestamp supports presets and tokens', () => {
    const d = new Date('2024-01-02T03:04:05.678Z');
    expect(LogM8Utils.formatTimestamp(d, 'iso')).toBe(d.toISOString());
    const s = LogM8Utils.formatTimestamp(d, 'yyyy-MM-dd hh:mm:ss.SSS z');
    expect(s).toMatch(/^2024-01-02 \d{2}:04:05\.678 /);
  });
});
