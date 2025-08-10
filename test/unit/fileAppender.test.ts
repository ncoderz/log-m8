import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import type { LogEvent } from '../../src/LogEvent.ts';
import { FileAppenderFactory } from '../../src/appenders/FileAppender.ts';
import { LogLevel } from '../../src/LogLevel.ts';

function makeEvent(): LogEvent {
  return {
    logger: 'file',
    level: LogLevel.info,
    message: 'hello',
    data: [1, { a: 2 }],
    context: {},
    timestamp: new Date('2024-01-02T03:04:05.678Z'),
  };
}

const tmp = 'app.log.test.tmp';

afterEach(() => {
  try {
    rmSync(tmp);
  } catch {
    /* ignore */
  }
});

describe('FileAppender', () => {
  it('writes newline-terminated lines, JSON stringifies non-strings', async () => {
    const f = new FileAppenderFactory();
    const a = f.create({ name: 'file', filename: tmp, append: false });
    const ev = makeEvent();
    a.write(ev);
    a.dispose();
    await new Promise((res) => setTimeout(res, 10));
    const content = readFileSync(tmp, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
    expect(content).toContain('hello');
    expect(content).toContain('"a": 2');
  });

  it('append=true preserves existing content', async () => {
    const f = new FileAppenderFactory();
    const a1 = f.create({ name: 'file', filename: tmp, append: false });
    a1.write(makeEvent());
    a1.dispose();
    const a2 = f.create({ name: 'file', filename: tmp, append: true });
    a2.write(makeEvent());
    a2.dispose();
    await new Promise((res) => setTimeout(res, 10));
    const text = readFileSync(tmp, 'utf8');
    const occurrences = (text.match(/hello/g) || []).length;
    expect(occurrences).toBe(2);
  });
});
