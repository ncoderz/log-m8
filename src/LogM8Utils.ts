const TIMESTAMP_TOKEN_REGEX = /(yyyy|SSS|hh|mm|ss|SS|yy|MM|dd|S)/g;

class LogM8Utils {
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

  public static formatTimestamp(date: Date, fmt?: string): string {
    if (!fmt || fmt === 'iso' || fmt === 'toISOString') {
      return date.toISOString();
    }
    if (fmt === 'locale' || fmt === 'toLocaleString') {
      return date.toLocaleString();
    }
    // Flexible format string support
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const tokens: Record<string, string> = {
      yyyy: pad(date.getFullYear(), 4),
      yy: pad(date.getFullYear() % 100),
      MM: pad(date.getMonth() + 1),
      dd: pad(date.getDate()),
      hh: pad(date.getHours()),
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds()),
      SSS: pad(date.getMilliseconds(), 3),
      SS: pad(Math.floor(date.getMilliseconds() / 10), 2),
      S: pad(Math.floor(date.getMilliseconds() / 100), 1),
    };
    // Match longest tokens first to avoid partial replacement
    return fmt.replace(TIMESTAMP_TOKEN_REGEX, (m) => tokens[m] ?? m);
  }
}

export { LogM8Utils };
