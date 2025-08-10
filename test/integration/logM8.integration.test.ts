import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LogLevel } from '../../src/LogLevel.ts';
import { LogM8 } from '../../src/LogM8.ts';

describe('LogM8 integration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation((() => {}) as unknown as typeof console.info);
    vi.spyOn(console, 'log').mockImplementation((() => {}) as unknown as typeof console.log);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('zero-config init logs to console via info', () => {
    const m = new LogM8();
    m.init();
    const logger = m.getLogger('root');
    logger.info('hello');
    expect(console.info).toHaveBeenCalled();
    m.dispose();
  });

  it('disabled levels are fast to skip', () => {
    const m = new LogM8();
    m.init();
    const logger = m.getLogger('root');
    logger.setLevel(LogLevel.error);
    const t0 = Date.now();
    for (let i = 0; i < 5000; i++) logger.debug('x', i);
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(5000);
    m.dispose();
  });
});
