import type { Filter } from '../Filter.ts';
import type { FilterConfig } from '../FilterConfig.ts';
import type { LogEvent } from '../LogEvent.ts';
import { LogM8Utils } from '../LogM8Utils.ts';
import type { PluginFactory } from '../PluginFactory.ts';
import { PluginKind } from '../PluginKind.ts';

/**
 * Configuration for DefaultFilter.
 *
 * Provides simple allow/deny rule maps where each key is a dot-path into the LogEvent
 * (supports array bracket notation like `data[0].items[2]`) and each value is the value
 * that must match for the rule to apply.
 *
 * Behavior:
 * - allow: If provided and non-empty, an event must satisfy ALL allow rules to pass.
 * - deny: If provided, an event that satisfies ANY deny rule will be blocked.
 * - Precedence: deny rules take precedence over allow; i.e., an event that passes allow
 *   but matches a deny rule will be denied.
 *
 * Examples:
 * ```ts
 * // Only allow events from a specific logger AND with a specific data value
 * { name: 'default-filter', allow: { 'logger': 'app.service', 'data[0].type': 'audit' } }
 *
 * // Deny events for a user id regardless of other matches
 * { name: 'default-filter', deny: { 'context.userId': '1234' } }
 *
 * // Combined example
 * {
 *   name: 'default-filter',
 *   allow: { 'logger': 'allow.this.logger', 'data[0].custom[3].path': 4 },
 *   deny:  { 'logger': 'block.this.logger', 'context.userId': '1234' }
 * }
 * ```
 */
export interface DefaultFilterConfig extends FilterConfig {
  /** All rules in this map must match for the event to be allowed (AND). */
  allow?: Record<string, unknown>;
  /** If any rule in this map matches, the event will be denied (OR). */
  deny?: Record<string, unknown>;
}

/**
 * Built-in filter providing straightforward allow/deny path-based matching.
 *
 * Use this when you want quick, declarative filtering without writing code. Rules are
 * evaluated against the LogEvent using robust dot-path resolution (with support for
 * `array[index]` notation). Comparisons use deep equality for objects/arrays and strict
 * equality for primitives.
 */
class DefaultFilter implements Filter {
  public name = 'default-filter';
  public version = '1.0.0';
  public kind = PluginKind.filter;

  public enabled = true;

  private _allow?: Record<string, unknown>;
  private _deny?: Record<string, unknown>;
  /**
   * Initializes allow/deny rule maps. Values are compared using deep equality for
   * arrays/objects and strict equality for primitives. Missing maps are treated as empty.
   * @param config - Filter configuration with optional allow/deny maps
   */
  public init(config: FilterConfig): void {
    const cfg = (config ?? {}) as DefaultFilterConfig;
    this._allow = cfg.allow ?? undefined;
    this._deny = cfg.deny ?? undefined;
    this.enabled = cfg.enabled !== false; // Default to true if not specified
  }

  public dispose(): void {
    // no resources to release
  }

  /**
   * Evaluates the given event against configured rules.
   * - allow: if provided and non-empty, ALL rules must match (AND)
   * - deny: if provided, ANY match denies (OR); deny takes precedence over allow
   * Returns false on unexpected errors to fail-safe.
   * @param logEvent - Event to evaluate
   * @returns true when the event should be logged; false to drop
   */
  public filter(logEvent: LogEvent): boolean {
    try {
      // Allow rules: if provided, ALL must match
      if (this._allow && Object.keys(this._allow).length > 0) {
        for (const [path, expected] of Object.entries(this._allow)) {
          const actual = LogM8Utils.getPropertyByPath(logEvent, path);
          if (!this._isEqual(actual, expected)) return false;
        }
      }

      // Deny rules: if ANY matches, deny
      if (this._deny && Object.keys(this._deny).length > 0) {
        for (const [path, expected] of Object.entries(this._deny)) {
          const actual = LogM8Utils.getPropertyByPath(logEvent, path);
          if (this._isEqual(actual, expected)) return false;
        }
      }

      return true;
    } catch (_err) {
      // Be conservative on unexpected errors
      return false;
    }
  }

  // Simple deep equality for primitives, arrays, plain objects, dates
  private _isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    // Handle NaN
    if (typeof a === 'number' && typeof b === 'number') {
      return Number.isNaN(a) && Number.isNaN(b);
    }

    // Dates
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this._isEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // Plain objects
    if (this._isPlainObject(a) && this._isPlainObject(b)) {
      const aKeys = Object.keys(a as Record<string, unknown>);
      const bKeys = Object.keys(b as Record<string, unknown>);
      if (aKeys.length !== bKeys.length) return false;
      for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(b as object, key)) return false;
        if (
          !this._isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        )
          return false;
      }
      return true;
    }

    return false;
  }

  private _isPlainObject(val: unknown): val is Record<string, unknown> {
    return (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      Object.getPrototypeOf(val) === Object.prototype
    );
  }
}

class DefaultFilterFactory implements PluginFactory<DefaultFilterConfig, DefaultFilter> {
  public name = 'default-filter';
  public version = '1.0.0';
  public kind = PluginKind.filter;

  public create(config: DefaultFilterConfig): DefaultFilter {
    const filter = new DefaultFilter();
    filter.init(config);
    return filter;
  }
}

export { DefaultFilterFactory };
