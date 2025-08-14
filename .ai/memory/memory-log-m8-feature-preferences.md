# log-m8: Feature preferences (WHY and HOW)

Date: 2025-08-14

## Why this matters
The maintainer wants a concise but powerful logging system. Future enhancements should be additive, minimal-surface, and align with the existing plugin architecture.

## Preferences to prioritize
1) Redaction filter (security)
   - Why: Prevent accidental secret leakage (passwords, tokens, Authorization header, emails).
   - How: Provide a built-in Filter with a small, configurable ruleset (keys and regex). Default-on for common secret keys, configurable per appender.
   - Notes: Mask strategy "***" or fixed-length asterisks; must not throw on exotic objects.

2) Sampling / rate-limiting filter
   - Why: Control log volume (esp. DEBUG/TRACE) and reduce noise/cost.
   - How: Simple APIs like sampleEvery(n) and/or tokens-per-interval; configurable per level.
   - Notes: Keep deterministic behavior in tests; allow disabling for critical levels.

3) File rotation and retention
   - Why: Prevent unbounded file growth; basic operational hygiene.
   - How: Start with size-based rotation (e.g., maxBytes) and retention count (maxFiles). Consider simple daily rolling later if needed.
   - Notes: Prefer extending the existing FileAppender or provide a RotatingFileAppender that wraps it. Back-pressure and concurrency behavior should be documented.

## Style & scope constraints
- Keep the system simple; avoid large frameworks or heavy config DSLs.
- Default-off unless clearly safe; make sensible defaults when enabled.
- Fit changes into the current plugin model (Formatter, Appender, Filter).
- Tests first: unit + minimal integration; no over-engineering.

## Secondary ideas (nice-to-have, not prioritized)
- JSON/NDJSON formatter, Async appender wrapper, Runtime level control.

## Usage guidance for future work
When proposing or implementing features, start with the three prioritized items, ensuring minimal public surface change and clear tests/docs. Tie into `spec/` and `doc/` updates only as needed to keep things concise.
