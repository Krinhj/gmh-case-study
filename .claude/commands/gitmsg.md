---
description: Generate a comprehensive commit message based on recent changes
---

Please analyze the current git changes and generate a comprehensive commit message following the Conventional Commits format.

First, run these commands to see what has changed:
1. Check git status to see modified files
2. Check git diff to see the actual changes

Then create a commit message with:

**Format:**
```
<type>: <short summary>

<detailed description>

<bulleted list of key changes>
```

**Types to use:**
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- style: UI/styling changes
- docs: Documentation
- chore: Build/config changes

**Requirements:**
- Short summary should be concise (50-72 chars)
- Detailed description should explain WHAT changed and WHY
- Include specific technical details (files, components, functions)
- List key changes as bullet points
- Include "Result:" section showing the outcome
- Add standard footer: "🤖 Generated with [Claude Code](https://claude.com/claude-code)"

Make it comprehensive enough that someone reviewing the commit history understands exactly what changed without reading the code.
