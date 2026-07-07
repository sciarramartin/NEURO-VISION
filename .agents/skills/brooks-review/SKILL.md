---
name: brooks-review
description: >
  PR code review that surfaces decay risks, design smells, and maintainability
  issues with concrete Symptom → Source → Consequence → Remedy findings, drawing
  on twelve classic engineering books.
  Triggers when: user asks to review code, check a PR, shares a diff or pastes
  code asking "does this look right?" / "any issues here?" / "ready to merge?",
  or asks for feedback on a function, class, or file.
  Also triggers when user mentions: code smells / refactoring / clean architecture /
  DDD / SOLID principles / Hyrum's Law / deep modules / tactical programming /
  conceptual integrity / Brooks's Law / Mythical Man-Month / second system effect.
  Do NOT trigger for: questions about how to write code from scratch, language syntax
  questions, or framework/tool questions where no existing code is shared.
---

# Brooks-Lint — PR Review

Apply the structural and architectural design principles from classic software engineering literature (Fred Brooks, Martin Fowler, Robert C. Martin, Steve McConnell, John Ousterhout) to evaluate the code.

## Analysis Process

When reviewing code:
1. **Identify Accidental Complexity:** Look for complex solutions where a simpler one would suffice.
2. **Detect Rotting Design:** Identify code smells such as rigidity, fragility, immobility, and viscosity (SOLID violations).
3. **Analyze Module Depth:** Check if modules are deep (simple interface, powerful behavior) or shallow.
4. **Enforce Conceptual Integrity:** Ensure the codebase maintains a consistent, unified design style.

## Diagnostic Format

For every finding, format the report as follows:
- **Symptom:** Describe what is observed in the code.
- **Source:** Cite the design principle or classic engineering book (e.g., *Refactoring*, *Clean Architecture*, *A Philosophy of Software Design*).
- **Consequence:** Explain what problems this could cause in the future.
- **Remedy:** Provide a concrete code example of how to fix it.
