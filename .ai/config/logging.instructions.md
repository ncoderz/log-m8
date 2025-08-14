# AI Logging Instructions

As an AI, you will log your actions and decisions in a structured manner to ensure traceability and
accountability. This logging will help in understanding the AI's behavior, debugging issues, and
improving future interactions.

Maintain a human-readable, append-only Markdown log in a file named `/.ai/log/ai-log.md`.

## FORMAT (exact structure)

```markdown
## <YYYY-MM-DD> (ISO date)

### <Concise feature/change title in sentence case>

<1–3 sentence high-level summary of WHAT changed and WHY. Present tense.>

- **Affects:** `[code]` `[spec]` `[test]` `[doc]` `[other]` <!-- Keep only the tags that truly changed; order as shown -->
- **Issue:** [#<number>](actual link to issue in github) <!-- Only if available -->
- **Pull Request:** [#<number>](actual link to pull-request in github) <!-- Only if available -->

#### <path/to/file_or_dir.ext>

- `<Tag>` <short, concrete description of the change>
- `<Tag>` <…>

#### <next/path.ext>

- `<Tag>` <…>

<!-- Continue "### <path>" sections for each touched file or doc. Group roughly as: src/*, spec/*, doc/*, test/* in that order. Leave a blank line between entries and between file sections. -->

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

(Do NOT invent other tags.)

## RULES

- Always append new entries under today’s `## YYYY-MM-DD` heading, creating it if missing.
- The log reads in reverse chronological order, so the most recent changes are at the top.
```

## Example Entries

```markdown
## 2023-10-08

### Implement status filters and bulk clear-completed

Adds UI filter tabs (All / Active / Completed) and a bulk action to remove all completed todos. Preserves the selected filter in the URL hash (e.g. `#/active`).

- **Affects:** `[code]` `[spec]` `[test]` `[doc]`
- **Issue:** [#212](https://github.com/userX/todo-list/issues/212)
- **Pull Request:** [#456](https://github.com/userX/todo-list/pull/456)

#### src/components/TodoList.tsx

- `Code +` Implemented filter logic and tabs; added `clearCompleted()` action.
- `Code ~` Refactored list rendering to derive visible items from `filter` state and memoized selectors.
- `Comment ~` Added JSDoc for `applyFilter(status)` and URL hash synchronization.

#### spec/spec.md

- `Spec +` Added FR-020 “Filter todos by status (All/Active/Completed)”.
- `Spec +` Added FR-021 “Bulk clear completed todos”.
- `Spec ~` Clarified expected behavior for empty states under each filter.

#### doc/api.md

- `Doc ~` Documented route hash mapping (`#/`, `#/active`, `#/completed`) and filter persistence rules.
- `Doc ~` Added usage notes for `clearCompleted()` and its non-destructive confirmation prompt.

#### test/unit/filters.test.ts

- `Test +` Coverage for filter transitions, URL hash sync, and list reactivity.
- `Test +` Ensures `clearCompleted()` removes only completed items and emits `todos:cleared` event.

### Add due dates with natural-language parsing and overdue highlighting

Introduces optional `dueAt` on todos, supports quick entry like “tomorrow 5pm” or “next Monday”, and highlights overdue tasks. Timezone-aware using the app’s configured TZ.

- **Affects:** `[code]` `[spec]` `[test]` `[doc]`
- **Issue:** [#198](https://github.com/userX/todo-list/issues/198)
- **Pull Request:** [#441](https://github.com/userX/todo-list/pull/441)

#### src/models/Todo.ts

- `Code +` Added `dueAt?: Date` to `Todo` model and serializer.
- `Code +` Implemented `parseDueDate(input: string, tz: string): Date | null`.
- `Code ~` Computed `isOverdue` and `dueIn` getters for badge rendering.
- `Comment ~` Documented parsing assumptions and ambiguity resolution (prefers upcoming weekday).

#### spec/spec.md

- `Spec +` Added FR-022 “Todos may have an optional due date”.
- `Spec +` Added FR-023 “Overdue todos must be visually indicated and sorted after active soon-due”.
- `Spec ~` Defined parsing rules for common phrases and 24h/12h time formats.

#### doc/api.md

- `Doc ~` Updated Task schema with `dueAt` (ISO 8601) and `isOverdue` (derived) fields.
- `Doc ~` Added examples for quick-entry syntax and error messages for invalid dates.

#### test/unit/due-date.test.ts

- `Test +` Cases for “today”, “tomorrow 17:00”, “next Monday 9am”, and invalid inputs.
- `Test +` Verifies timezone handling (DST edge), `isOverdue` logic, and sort order with mixed due dates.
```
