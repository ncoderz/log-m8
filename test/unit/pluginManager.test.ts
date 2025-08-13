import { describe, expect, it } from 'vitest';

import type { Plugin } from '../../src/Plugin.ts';
import type { PluginFactory } from '../../src/PluginFactory.ts';
import { PluginKind } from '../../src/PluginKind.ts';
import { PluginManager } from '../../src/PluginManager.ts';

class DummyPlugin implements Plugin {
  name = 'dummy';
  version = '1.0.0';
  kind = PluginKind.filter;
  inited = false;
  disposed = false;
  init(): void {
    this.inited = true;
  }
  dispose(): void {
    this.disposed = true;
  }
}

class DummyFactory implements PluginFactory {
  name = 'dummy';
  version = '1.0.0';
  kind = PluginKind.filter;
  create(): Plugin {
    const p = new DummyPlugin();
    p.init();
    return p;
  }
}

describe('PluginManager', () => {
  it('registers factory and creates plugin by kind + name', () => {
    const pm = new PluginManager();
    pm.registerPluginFactory(new DummyFactory());
    const p = pm.createPlugin(PluginKind.filter, 'dummy');
    expect(p.name).toBe('dummy');
  });

  it('throws on duplicate factory registration', () => {
    const pm = new PluginManager();
    pm.registerPluginFactory(new DummyFactory());
    expect(() => pm.registerPluginFactory(new DummyFactory())).toThrowError(/already registered/i);
  });

  it('throws when creating plugin with missing factory', () => {
    const pm = new PluginManager();
    expect(() => pm.createPlugin(PluginKind.filter, 'missing')).toThrowError(/not found/i);
  });

  it('disposes created plugins', () => {
    const pm = new PluginManager();
    pm.registerPluginFactory(new DummyFactory());
    const p = pm.createPlugin(PluginKind.filter, 'dummy') as DummyPlugin;
    expect(p.inited).toBe(true);
    pm.disposePlugins();
    expect(p.disposed).toBe(true);
  });
});
