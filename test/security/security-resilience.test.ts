import { readFileSync, rmSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { FileAppenderFactory } from '../../src/appenders/FileAppender.ts';
import { DefaultFormatterFactory } from '../../src/formatters/DefaultFormatter.ts';
import { LogLevel } from '../../src/LogLevel.ts';

describe('Security/Resilience', () => {
  it('formatter does not evaluate arbitrary tokens', () => {
    const f = new DefaultFormatterFactory().create({ name: 'default', format: '{__proto__}.evil' });
    const tokens = f.format({
      logger: 's',
      level: LogLevel.info,
      message: 'x',
      data: [],
      context: {},
      timestamp: new Date(),
    });
    // Should not throw and should include literal or undefined resolution safely
    expect(Array.isArray(tokens)).toBe(true);
  });

  it('file appender stringifies safely when JSON.stringify fails (circular)', async () => {
    const a = new FileAppenderFactory().create({
      name: 'file',
      filename: 'security.tmp',
      append: false,
    });
    const circ: Record<string, unknown> = { a: 1 };
    circ.self = circ;
    a.write({
      logger: 's',
      level: LogLevel.info,
      message: 'circular',
      data: [circ],
      context: {},
      timestamp: new Date(),
    });
    a.dispose();
    await new Promise((r) => setTimeout(r, 5));
    const text = readFileSync('security.tmp', 'utf8');
    expect(text.length).toBeGreaterThan(0);
    rmSync('security.tmp');
  });
});
