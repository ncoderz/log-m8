/**
 * Regex pattern for matching timestamp format tokens.
 *
 * Matches tokens in descending length order to prevent partial replacement
 * (e.g., 'SSS' before 'SS' before 'S'). Used by formatTimestamp to identify
 * and replace format placeholders.
 */
const TIMESTAMP_TOKEN_REGEX = /(yyyy|SSS|hh|mm|ss|SS|zz|z|yy|MM|dd|A|a|h|S)/g;

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
}

export { LogM8Utils };
