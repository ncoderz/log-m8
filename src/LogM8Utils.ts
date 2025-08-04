/**
 * Regex matching timestamp format tokens
 * Used by formatTimestamp to identify and replace tokens in a format string.
 */
const TIMESTAMP_TOKEN_REGEX = /(yyyy|SSS|hh|mm|ss|SS|zz|z|yy|MM|dd|A|a|h|S)/g;

/**
 * Utility functions for formatting timestamps and accessing nested properties in log data.
 */
class LogM8Utils {
  /**
   * Returns true if running in a browser environment.
   * @returns True when window and document objects are available.
   */
  public static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  }

  /**
   * Retrieves a nested property value from an object using a dot-separated path.
   * @param obj - The object to traverse.
   * @param path - Dot-separated string path (e.g., "user.profile.name").
   * @returns The value at the path or undefined if not found.
   */
  public static getPropertyByPath(obj: unknown, path: string): unknown {
    let value = obj;
    const segments = path.split('.');
    for (const key of segments) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
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
   * Formats a Date into a string based on the given format or presets.
   * Supports ISO (iso, toISOString), locale (locale, toLocaleString), or custom token formats.
   * Supports tokens:
   * - yyyy: 4-digit year (e.g., 2025)
   * - yy: 2-digit year (e.g., 25)
   * - MM: month (01-12) (e.g., 08)
   * - dd: day of month (01-31) (e.g., 04)
   * - hh: hour in 24-hour format (00-23) (e.g., 14)
   * - h: hour in 12-hour format (1-12) (e.g., 2)
   * - mm: minutes (00-59) (e.g., 07)
   * - ss: seconds (00-59) (e.g., 09)
   * - SSS: milliseconds (000-999) (e.g., 123)
   * - SS: centiseconds (00-99) (e.g., 12)
   * - S: deciseconds (0-9) (e.g., 1)
   * - A: AM/PM (e.g., PM)
   * - a: am/pm (e.g., pm)
   * - z: timezone offset (±HH:MM) (e.g., -07:00)
   * - zz: timezone offset without colon (±HHMM) (e.g., -0700)
   *
   * anything that is not a token is a literal string and will be included as-is in the output.
   *
   * Example formats:
   * - "iso" → "2023-10-01T12:34:56.789Z"
   * - "locale" → "10/1/2023, 12:34:56 PM"
   * - "yyyy-MM-dd hh:mm:ss" → "2023-10-01 14:34:56"
   * - "MM/dd/yyyy" → "10/01/2023"
   * - "yyyy-MM-dd hh:mm:ss z" → 2025-08-04 14:23:45 -07:00
   * - "yyyy-MM-dd hh:mm:ss zz" → 2025-08-04 14:23:45 -0700
   *
   * @param date - The Date to format.
   * @param fmt - Format string or preset key ('iso', 'locale').
   * @returns The formatted timestamp string.
   */
  public static formatTimestamp(date: Date, fmt?: string): string {
    const fmtLower = fmt?.toLowerCase();
    if (!fmt || fmtLower === 'iso' || fmtLower === 'toisostring') {
      return date.toISOString();
    }
    if (fmtLower === 'locale' || fmtLower === 'tolocalestring') {
      return date.toLocaleString();
    }
    // Flexible format string support
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    // Match longest tokens first to avoid partial replacement
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
          // Timezone offset in minutes: positive is ahead of UTC
          const tzOffset = -date.getTimezoneOffset();
          const tzSign = tzOffset >= 0 ? '+' : '-';
          const tzHours = Math.floor(Math.abs(tzOffset) / 60);
          const tzMinutes = Math.abs(tzOffset) % 60;
          if (m === 'z') {
            // Return as ±HH:MM
            return `${tzSign}${pad(tzHours)}:${pad(tzMinutes)}`;
          }
          // Return as ±HHMM
          return `${tzSign}${pad(tzHours)}${pad(tzMinutes)}`;
        }

        default:
          return m;
      }
    });
  }
}

export { LogM8Utils };
