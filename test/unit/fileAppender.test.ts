import { readFileSync, rmSync } from 'fs';
import { afterEach, describe, expect, it } from 'vitest';

import { FileAppender } from '../../src/appenders/FileAppender.ts';
import { DefaultFormatterFactory } from '../../src/formatters/DefaultFormatter.ts';
import { JsonFormatterFactory } from '../../src/formatters/JsonFormatter.ts';
import type { LogEvent } from '../../src/LogEvent.ts';
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
  it('writes newline-terminated lines, string-coerces non-strings when using DefaultFormatter', async () => {
    const formatter = new DefaultFormatterFactory().create({ name: 'default' });
    const a = new FileAppender();
    a.init({ name: 'file', filename: tmp, append: false }, formatter, []);
    const ev = makeEvent();
    a.write(ev);
    a.dispose();
    await new Promise((res) => setTimeout(res, 10));
    const content = readFileSync(tmp, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
    expect(content).toContain('hello');
    // Default formatter expands data; FileAppender coerces objects via String()
    expect(content).toContain('[object Object]');
  });

  it('append=true preserves existing content', async () => {
    const formatter = new DefaultFormatterFactory().create({ name: 'default' });
    const a1 = new FileAppender();
    a1.init({ name: 'file', filename: tmp, append: false }, formatter, []);
    a1.write(makeEvent());
    a1.dispose();

    // Wait for the first stream to close completely
    await new Promise((res) => setTimeout(res, 50));

    const a2 = new FileAppender();
    a2.init({ name: 'file', filename: tmp, append: true }, formatter, []);
    a2.write(makeEvent());
    a2.dispose();

    // Wait for the second stream to close completely
    await new Promise((res) => setTimeout(res, 50));

    const text = readFileSync(tmp, 'utf8');
    const occurrences = (text.match(/hello/g) || []).length;
    expect(occurrences).toBe(2);
  });

  it('writes a single JSON line when using JsonFormatter', async () => {
    const formatter = new JsonFormatterFactory().create({ name: 'json' });
    const a = new FileAppender();
    a.init({ name: 'file', filename: tmp, append: false }, formatter, []);
    const ev = makeEvent();
    a.write(ev);
    a.dispose();
    await new Promise((res) => setTimeout(res, 10));

    const content = readFileSync(tmp, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
    const lines = content.trimEnd().split('\n');
    expect(lines.length).toBe(1);
    const obj = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(obj.timestamp).toBe('2024-01-02T03:04:05.678Z');
    expect(obj.level).toBe('info');
    expect(obj.logger).toBe('file');
    expect(obj.message).toBe('hello');
    expect(Array.isArray(obj.data)).toBe(true);
    const data = obj.data as unknown[];
    expect(data[0]).toBe(1);
    expect((data[1] as { a: number }).a).toBe(2);
  });
});
