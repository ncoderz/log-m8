# log-m8: Runtime filter toggling implemented

Date: 2025-08-15

Why this matters:
- The library now supports enabling/disabling filters both globally and per-appender at runtime, plus an initial `enabled` flag in FilterConfig. Future proposals and examples should leverage this capability and keep semantics consistent.

What to remember:
- Public APIs: `Logging.enableFilter(name, appenderName?)` and `Logging.disableFilter(name, appenderName?)`.
- Config: `LoggingConfig.filters?: (string | FilterConfig)[]` for global filters; `FilterConfig.enabled?: boolean` default true.
- Appenders implement `enableFilter(name)` / `disableFilter(name)` to toggle local filter instances.
- Evaluation order: global filters first, then appender-level filters. Disabled filters are skipped.

How to use this memory:
- When writing docs/specs/examples, include runtime toggling patterns and global filter configuration.
- When proposing features that interact with filters, consider enabled state and order.
