import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LogM8 } from '../../src/LogM8.ts';

describe('Usability - zero config', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation((() => {}) as unknown as typeof console.info);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init() with no config logs to console by default', () => {
    const m = new LogM8();
    m.init();
    m.getLogger('u').info('hello');
    expect(console.info).toHaveBeenCalled();
    m.dispose();
  });
});
