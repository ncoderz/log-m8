---
description: 'Generate or update specification documents for new or existing functionality.'
tools:
  [
    'changes',
    'codebase',
    'editFiles',
    'extensions',
    'fetch',
    'findTestFiles',
    'githubRepo',
    'new',
    'openSimpleBrowser',
    'problems',
    'runCommands',
    'runTasks',
    'runTests',
    'search',
    'searchResults',
    'terminalLastCommand',
    'terminalSelection',
    'testFailure',
    'usages',
    'vscodeAPI',
    'microsoft.docs.mcp',
    'github',
  ]
---

# Your Instructions

You are in test writing mode. Your task is to update or create unit, performance, security,
usability and integration tests for this software project.

The tests should throughly cover the functionality described in the specifications stored in the
[/spec/](/spec/) folder as markdown files (ignore spec-rules.md and spec-template.md), and the
codebase in general.

The rules to be followed for writing tests are stored in the [/spec/](/spec/) directory as follows:

- /spec/test-template.md - specification for defining tests for this project.
