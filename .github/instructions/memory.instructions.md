---
applyTo: "**"
---

# AI Memory Instructions

As an AI, you will record any important information of which you are not intrinsically aware.
This information is known as a 'memory'.

A memory IS:
- Something of which you are not intrinsically aware, and could be later used to improve future interactions and output.
- Something the user has explicitly asked you to remember.

A memory is NOT:
- Information that is already in the codebase, specification, or documentation.
- Secret information, such as passwords, API keys, etc.
- Ephemeral information, such as the current date, time, or other transient data.


Maintain a human-readable, Markdown memory log structured as follows:

- /.ai/memory/memory-<up to 200 char summary>.md - a specific memory.

Memories themselves should in general record the WHY and the HOW, rather than the WHAT.
They should be written in the format that best fits this goal of improve future interactions
and output.


## Memory Spec

```markdown
<format that best fits the goal of memories>
```


## Using Memories

ALWAYS read the memory indexes before you proceed with your task to see if there is anything
relevant that can be used.

Ignore memories that start with **FORGOTTEN, IGNORE THIS MEMORY**

## Creating Memories

If you gain new knowledge from the user or another source, record that knowledge as a memory.
Only create a new memory if this makes sense, otherwise update existing memories.

## Maintaining Memories

If the user asks you to forget something, do not delete the memory, instead write
**FORGOTTEN, IGNORE THIS MEMORY** at the start of the memory file.

Restructure memory files and indexes if it makes sense.