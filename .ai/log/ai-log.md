## 2025-08-17

### Add test for global vs per-logger level interaction

Add unit test ensuring per-logger levels remain effective while the global level acts as an upper bound, verifying behavior across changes to the global level.

- **Affects:** `[test]` `[doc]`

#### test/unit/logM8.test.ts

- `Test +` Added "per-logger levels combine with global level as the stricter bound" case covering three phases (global info -> debug -> info) across two loggers (warn and debug).

#### .ai/log/ai-log.md

- `Doc +` Logged addition of the unit test per AI logging rules.

### Document runtime setLevel usage and interaction rules in README

Explains how to change global vs per-logger levels at runtime, including interaction semantics and a usage example.

- **Affects:** `[doc]`

#### README.md

- `Doc ~` Added section "Adjusting log levels at runtime" documenting `LogM8.setLevel(level, loggerName?)`, effective-level rule, and example sequence.

## TAGS (use exactly these labels; choose the right ones)

- Tag format it `<Code|Comment|Spec|Doc|Test|Other> <+|-|~>`
	- `+` Added
	- `-` Removed
	- `~` Modified
	- `Code` Code, types, models, functions, or commands (non-doc).
	- `Comment` Inline/API comments/JSDoc/docstrings in source files.
	- `Spec` Specifications / requirements.
	- `Doc` End-user or API documentation (non-spec).
	- `Test` Tests or fixtures.
	- `Other` Anything that cannot fit the above tags.

