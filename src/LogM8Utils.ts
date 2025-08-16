/**
 * Regex pattern for matching timestamp format tokens.
 *
 * Matches tokens in descending length order to prevent partial replacement
 * (e.g., 'SSS' before 'SS' before 'S'). Used by formatTimestamp to identify
 * and replace format placeholders.
 */
const TIMESTAMP_TOKEN_REGEX = /(yyyy|SSS|hh|mm|ss|SS|zz|z|yy|MM|dd|A|a|h|S)/g;

// Constants for error serialization
const EXCLUDED_ERROR_KEYS = new Set(['name', 'message', 'stack', 'cause']);
const COMMON_NON_ENUMERABLE_PROPS = ['code', 'errno', 'syscall', 'path'] as const;

export interface StringifyLogOptions {
  /** Max object/array nesting depth to descend into (default 3). */
  maxDepth?: number;
  /** Truncate long string values to this length (default 200). */
  maxStringLength?: number;
  /** Truncate long arrays to this length (default: 100) */
  maxArrayLength?: number;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError | null;
  [key: string]: unknown; // For additional properties
}

/**
 * Utility functions for timestamp formatting and object property access.
 *
 * Provides environment detection, nested property traversal, and flexible
 * timestamp formatting with support for custom tokens, ISO formats, and
 * locale-specific output.
 */
class LogM8Utils {
  /**
   * Detects browser environment for feature compatibility.
   *
   * @returns True when both window and document global objects are available
   */
  public static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  }

  /**
   * Check if an object is a string.
   *
   * @param obj - The object to check.
   * @returns true if the object is a string, otherwise false.
   */
  public static isString(obj: unknown): boolean {
    return typeof obj === 'string' || obj instanceof String;
  }

  /**
   * Traverses nested object properties using dot-separated path notation.
   *
   *  Supports both object property access and array indexing with numeric keys.
   *  Also supports bracket notation for array indices which is normalized internally
   *  (e.g., `data[0].items[2]` becomes `data.0.items.2`).
   *  Safe navigation that returns undefined for invalid paths rather than throwing.
   *
   *  @param obj - Source object to traverse
   *  @param path - Dot-separated property path (e.g., 'user.profile.name', 'items.0.id')
   *               or a path with bracket indices (e.g., 'items[0].id')
   *  @returns Property value at the specified path, or undefined if not found
   *
   *  @example
   *  ```typescript
   *  const data = { user: { profile: { name: 'John' } }, items: [{ id: 1 }, { id: 2 }] };
   *  getPropertyByPath(data, 'user.profile.name'); // 'John'
   *  getPropertyByPath(data, 'items.0.id');        // 1
   *  getPropertyByPath(data, 'items[1].id');       // 2 (bracket notation)
   *  getPropertyByPath(data, 'missing.path');      // undefined
   *  ```
   */
  public static getPropertyByPath(obj: unknown, path: string): unknown {
    let value = obj;
    // Support bracket index notation by converting to dot-separated tokens, e.g., data[0].items[2] -> data.0.items.2
    const normalized = path.replace(/\[(\d+)\]/g, '.$1');
    const segments = normalized.split('.');
    for (const key of segments) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Handle array indexing with numeric keys
          const idx = Number(key);
          if (Number.isInteger(idx) && idx >= 0) {
            value = value[idx];
            continue;
          }
        }
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  /**
   * Formats Date objects using preset formats or custom token patterns.
   *
   * Supports common presets ('iso', 'locale') and flexible token-based formatting
   * for complete control over timestamp appearance. Tokens are replaced with
   * corresponding date/time components, while non-token text is preserved literally.
   *
   * Supported format tokens:
   * - yyyy: 4-digit year (2025)
   * - yy: 2-digit year (25)
   * - MM: month with leading zero (01-12)
   * - dd: day with leading zero (01-31)
   * - hh: 24-hour format hour with leading zero (00-23)
   * - h: 12-hour format hour (1-12)
   * - mm: minutes with leading zero (00-59)
   * - ss: seconds with leading zero (00-59)
   * - SSS: milliseconds with leading zeros (000-999)
   * - SS: centiseconds with leading zero (00-99)
   * - S: deciseconds (0-9)
   * - A: uppercase AM/PM
   * - a: lowercase am/pm
   * - z: timezone offset with colon (±HH:MM)
   * - zz: timezone offset without colon (±HHMM)
   *
   * @param date - Date instance to format
   * @param fmt - Format preset ('iso'|'locale') or custom token pattern
   * @returns Formatted timestamp string
   *
   * @example
   * ```typescript
   * const date = new Date('2025-08-04T14:23:45.123Z');
   *
   * // Presets
   * formatTimestamp(date, 'iso');    // '2025-08-04T14:23:45.123Z'
   * formatTimestamp(date, 'locale'); // '8/4/2025, 2:23:45 PM' (locale-dependent)
   *
   * // Custom patterns
   * formatTimestamp(date, 'yyyy-MM-dd hh:mm:ss');     // '2025-08-04 14:23:45'
   * formatTimestamp(date, 'MM/dd/yyyy h:mm A');       // '08/04/2025 2:23 PM'
   * formatTimestamp(date, 'hh:mm:ss.SSS');            // '14:23:45.123'
   * formatTimestamp(date, 'yyyy-MM-dd hh:mm:ss z');   // '2025-08-04 14:23:45 +00:00'
   * ```
   */
  public static formatTimestamp(date: Date, fmt?: string): string {
    const fmtLower = fmt?.toLowerCase();
    if (!fmt || fmtLower === 'iso' || fmtLower === 'toisostring') {
      return date.toISOString();
    }
    if (fmtLower === 'locale' || fmtLower === 'tolocalestring') {
      return date.toLocaleString();
    }

    // Custom token-based formatting
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    // Process tokens in descending length order to avoid partial matches
    return fmt.replace(TIMESTAMP_TOKEN_REGEX, (m) => {
      switch (m) {
        case 'yyyy':
          return pad(date.getFullYear(), 4);
        case 'yy':
          return pad(date.getFullYear() % 100);
        case 'MM':
          return pad(date.getMonth() + 1);
        case 'dd':
          return pad(date.getDate());
        case 'hh':
          return pad(hours24);
        case 'h':
          return pad(hours12);
        case 'mm':
          return pad(date.getMinutes());
        case 'ss':
          return pad(date.getSeconds());
        case 'SSS':
          return pad(date.getMilliseconds(), 3);
        case 'SS':
          return pad(Math.floor(date.getMilliseconds() / 10), 2);
        case 'S':
          return pad(Math.floor(date.getMilliseconds() / 100), 1);
        case 'A':
          return hours24 < 12 ? 'AM' : 'PM';
        case 'a':
          return hours24 < 12 ? 'am' : 'pm';
        case 'z':
        case 'zz': {
          // Calculate timezone offset: positive values are ahead of UTC
          const tzOffset = -date.getTimezoneOffset();
          const tzSign = tzOffset >= 0 ? '+' : '-';
          const tzHours = Math.floor(Math.abs(tzOffset) / 60);
          const tzMinutes = Math.abs(tzOffset) % 60;
          if (m === 'z') {
            // Format as ±HH:MM with colon separator
            return `${tzSign}${pad(tzHours)}:${pad(tzMinutes)}`;
          }
          // Format as ±HHMM without separator
          return `${tzSign}${pad(tzHours)}${pad(tzMinutes)}`;
        }

        default:
          return m;
      }
    });
  }

  /**
   * Converts arbitrary values into JSON strings optimized for logging systems.
   *
   * This utility ensures that any JavaScript value can be safely logged without causing
   * serialization errors or producing excessively large output. It's designed specifically
   * for logging contexts where reliability and readability are more important than
   * perfect fidelity.
   *
   * ## Key Features
   *
   * **Depth Protection**: Prevents stack overflows and excessive output by limiting
   * object traversal depth. Objects/arrays beyond the limit are replaced with
   * "[Object]" or "[Array]" placeholders.
   *
   * **Array Length Limiting**: Automatically truncates arrays that exceed the maximum
   * length threshold. Truncated arrays include a message indicating how many additional
   * items were omitted.
   *
   * **String Truncation**: Automatically truncates long strings to prevent log flooding.
   * Truncated strings end with an ellipsis (…) character.
   *
   * **Type Safety**: Handles problematic JavaScript types that would normally cause
   * JSON.stringify to throw:
   * - BigInt values are converted to strings
   * - Date objects are normalized to ISO 8601 format
   * - Error instances are serialized to structured objects via {@link LogM8Utils.serializeError}
   *
   * ## Implementation Details
   *
   * - Uses a WeakMap to track traversal depth per object, preventing revisits to the
   *   same instance at different depths
   * - Respects existing `toJSON()` methods on objects
   * - Not designed for full cycle detection - cyclic references are handled by the
   *   depth limit rather than explicit cycle breaking
   * - The replacer function executes in the context of the parent object, enabling
   *   depth tracking through the traversal
   *
   * @param value - Any JavaScript value to stringify for logging (events, contexts, errors, etc.)
   * @param options - Configuration for controlling output size and complexity
   * @param options.maxDepth - Maximum nesting depth for objects/arrays (default: 3).
   *                           Level 0 = primitive values only,
   *                           Level 1 = top-level properties,
   *                           Level 2 = nested properties, etc.
   * @param options.maxArrayLength - Maximum number of array elements to include before truncation (default: 100).
   *                                 Arrays exceeding this limit will be truncated with a message
   *                                 indicating the number of omitted items.
   * @param options.maxStringLen - Maximum character length for strings before truncation (default: 200)
   * @param space - Indentation for pretty-printing. Can be a number (spaces) or string (e.g., '\t').
   *               Pass undefined for compact output (recommended for production logs).
   *
   * @returns A JSON string that is guaranteed to be safe for logging systems
   *
   * @example
   * // Basic usage with default options
   * const json = LogM8Utils.stringifyLog({ message: 'User logged in', userId: 12345 });
   * // => '{"message":"User logged in","userId":12345}'
   *
   * @example
   * // Handling problematic types
   * const data = {
   *   bigNumber: 123456789012345678901234567890n,
   *   timestamp: new Date('2024-01-15T10:30:00Z'),
   *   error: new Error('Connection failed'),
   *   longText: 'x'.repeat(500)
   * };
   * const json = LogM8Utils.stringifyLog(data);
   * // => '{"bigNumber":"123456789012345678901234567890","timestamp":"2024-01-15T10:30:00.000Z","error":{...},"longText":"xxx...xxx…"}'
   *
   * @example
   * // Array length limiting for large arrays
   * const largeData = {
   *   items: new Array(1000).fill({ id: 1, name: 'item' }),
   *   values: Array.from({ length: 500 }, (_, i) => i)
   * };
   * const json = LogM8Utils.stringifyLog(largeData, { maxArrayLength: 50 });
   * // => '{"items":[{...},{...},...,"... 950 more items"],"values":[0,1,2,...,"... 450 more items"]}'
   *
   * @example
   * // Depth limiting for deeply nested objects
   * const deepObj = {
   *   level1: {
   *     level2: {
   *       level3: {
   *         level4: {
   *           level5: 'too deep'
   *         }
   *       }
   *     }
   *   }
   * };
   * const json = LogM8Utils.stringifyLog(deepObj, { maxDepth: 3 });
   * // => '{"level1":{"level2":{"level3":{"level4":"[Object]"}}}}'
   *
   * @example
   * // Custom options for verbose debugging
   * const debugJson = LogM8Utils.stringifyLog(
   *   complexObject,
   *   { maxDepth: 5, maxArrayLength: 500, maxStringLen: 1000 },
   *   2  // Pretty print with 2 spaces
   * );
   *
   * @example
   * // Production logging with minimal output
   * const prodJson = LogM8Utils.stringifyLog(
   *   userEvent,
   *   { maxDepth: 2, maxArrayLength: 20, maxStringLen: 100 }  // Aggressive truncation for high-volume logs
   * );
   *
   * @example
   * // Handling arrays with mixed content
   * const mixedArray = {
   *   results: [
   *     { id: 1, data: 'first' },
   *     { id: 2, data: 'second' },
   *     ...Array(200).fill({ id: 999, data: 'bulk' })
   *   ]
   * };
   * const json = LogM8Utils.stringifyLog(mixedArray, { maxArrayLength: 10 });
   * // First 10 items preserved, then truncation message
   *
   * @see {@link LogM8Utils.serializeError} - For Error serialization details
   */
  public static stringifyLog(
    value: unknown,
    { maxDepth = 3, maxStringLength = 200, maxArrayLength = 100 }: StringifyLogOptions = {},
    space?: number | string,
  ): string {
    const levels = new WeakMap<object, number>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function replacer(this: any, key: string, v: any): any {
      // Depth gate first: if we've reached the cap, stop descending
      if (v && typeof v === 'object') {
        const parentLevel = levels.get(this as object) ?? 0;
        if (parentLevel >= maxDepth) {
          return Array.isArray(v) ? '[Array]' : '[Object]';
        }
        levels.set(v as object, parentLevel + 1);

        // Array length limiting
        if (Array.isArray(v) && v.length > maxArrayLength) {
          const truncated = v.slice(0, maxArrayLength);
          truncated.push(`... ${v.length - maxArrayLength} more items`);
          return truncated;
        }
      }

      // Practical logging tweaks
      if (LogM8Utils.isString(v) && v.length > maxStringLength) {
        return v.slice(0, maxStringLength) + '…';
      }
      if (typeof v === 'bigint') {
        return v.toString();
      }
      if (v instanceof Date) {
        return v.toISOString();
      }
      if (v instanceof Error) {
        return LogM8Utils.serializeError(v);
      }

      return v;
    }

    return JSON.stringify(value, replacer, space);
  }

  /**
   * Serializes an Error (or Error-like) into a plain, JSON-safe object.
   *
   * Behavior:
   * - Returns null for falsy inputs.
   * - If the object provides a custom toJSON(), that result is used verbatim to
   *   honor caller-defined serialization.
   * - Otherwise includes standard fields: name, message, stack.
   * - Recursively serializes the optional error.cause chain using the same rules.
   * - Handles circular references in the cause chain safely.
   * - Copies other own enumerable properties (excluding name, message, stack, cause),
   *   skipping properties that throw on access or are not JSON-serializable.
   * - Optionally includes common non-enumerable properties like 'code' if present.
   *
   * Important:
   * - This function does not attempt to preserve all non-enumerable properties.
   * - Circular references in the cause chain are detected and handled gracefully.
   *
   * @param error - Unknown error input (Error instance or compatible object).
   * @returns Structured error data suitable for logging, or null when input is falsy.
   *
   * @example
   * try {
   *   throw new Error('Boom');
   * } catch (e) {
   *   const payload = LogM8Utils.serializeError(e);
   *   // { name: 'Error', message: 'Boom', stack: '...', ... }
   * }
   */
  public static serializeError(error: unknown): SerializedError | null {
    // Internal recursive function with circular reference tracking
    const serializeErrorInternal = (
      error: unknown,
      seen: WeakSet<object>,
    ): SerializedError | null => {
      // Handle non-error values
      if (!error) return null;

      // Type guard to check if it's an Error-like object
      const errorObj = error as Error;

      // Prevent circular references
      if (typeof errorObj === 'object' && errorObj !== null) {
        if (seen.has(errorObj)) {
          return {
            name: 'CircularReference',
            message: 'Circular reference detected in error cause chain',
          };
        }
        seen.add(errorObj);
      }

      // If the error has a toJSON method, use it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (errorObj as any).toJSON === 'function') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (errorObj as any).toJSON();
          // Ensure the result is JSON-serializable
          JSON.stringify(result);
          return result;
        } catch (_e) {
          // If toJSON fails or returns non-serializable data, continue with standard serialization
        }
      }

      // Create base error object
      const serialized: SerializedError = {
        name: errorObj.name || 'Error',
        message: errorObj.message || '',
        stack: errorObj.stack,
      };

      // Handle the 'cause' property recursively
      if ('cause' in errorObj && errorObj.cause !== undefined) {
        serialized.cause = serializeErrorInternal(errorObj.cause, seen);
      }

      // Set of standard properties to exclude

      // Include other enumerable properties
      // This catches custom properties added to the error
      for (const key in errorObj) {
        if (Object.prototype.hasOwnProperty.call(errorObj, key) && !EXCLUDED_ERROR_KEYS.has(key)) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = (errorObj as any)[key];
            // Ensure the value is JSON-serializable
            JSON.stringify(value);
            serialized[key] = value;
          } catch (_e) {
            // Skip properties that can't be accessed or aren't JSON-serializable
          }
        }
      }

      // Optionally include specific non-enumerable properties that are commonly used
      for (const prop of COMMON_NON_ENUMERABLE_PROPS) {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(errorObj, prop);
          if (descriptor && descriptor.value !== undefined) {
            // Ensure the value is JSON-serializable
            JSON.stringify(descriptor.value);
            serialized[prop] = descriptor.value;
          }
        } catch (_e) {
          // Skip if property access fails or value is not serializable
        }
      }

      return serialized;
    };

    // Start the serialization with a fresh WeakSet for tracking
    return serializeErrorInternal(error, new WeakSet());
  }
}

export { LogM8Utils };
