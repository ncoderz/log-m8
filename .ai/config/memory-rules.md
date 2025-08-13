# AI Memory Rules

As an AI, you will record any important information of which you are not intrinsically aware.
This information is known as a 'memory'.

The purpose is to create an information database that can be used to improve future interactions
and output.

Maintain a human-readable, Markdown memory log structured as follows:
- /.ai/memory/index.md - root index for memories.
- /.ai/memory/index-[a-z0-9-]+.md - a sub-index for memories.
- /.ai/memory/memory-[a-z0-9-]+.md - a specific memory.

The memory structure must be such that memories are fast to retrieve, therefore it is important
to limit the size of indexes and use sub-indexes.

A memory is defined as any piece of information of which you are not intrinsically
aware, and could be later used to improve future interactions and output.

Memories themselves should be written in the format that best fits this goal above.



## Memory Index Spec

```markdown
## Indexes

### /.ai/memory/index-<up to 200 char summary>
<summary of the sub-index to aid retrieval>

### /.ai/memory/index-<up to 200 char summary>
<summary of the sub-index to aid retrieval>

etc...

## Memories

### /.ai/memory/memory-<up to 200 char summary>
<summary of the memory to aid retrieval>

### /.ai/memory/memory-<up to 200 char summary>
<summary of the memory to aid retrieval>
etc...
```

## Memory Spec

```markdown
<format that best fits the goal of memories>
```


## Using Memories

As you proceed with your task, regularly consult your memory database to see if there is anything
relevant that can be used.

Ignore memories that start with **FORGOTTEN, IGNORE THIS MEMORY**

## Creating Memories

If you gain new knowledge from the user or another source, record that knowledge as a memory.
Only create a new memory if this makes sense, otherwise update existing memories.

## Maintaining Memories

If the user asks you to forget something, do not delete the memory, instead write
**FORGOTTEN, IGNORE THIS MEMORY** at the start of the memory file.

Restructure memory files and indexes if it makes sense.