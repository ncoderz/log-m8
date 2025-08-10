import { describe, expect, it } from 'vitest';

import { LogLevel } from '../../src/LogLevel.ts';
import { LogM8 } from '../../src/LogM8.ts';

describe('Performance - disabled logs fast', () => {
  it('debug when level=error should be very fast', () => {
    const m = new LogM8();
    m.init();
    const logger = m.getLogger('perf');
    logger.setLevel(LogLevel.error);
    const t0 = Date.now();
    for (let i = 0; i < 10000; i++) logger.debug('x', i);
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(200); // loose bound, environment-dependent
    m.dispose();
  });
});
