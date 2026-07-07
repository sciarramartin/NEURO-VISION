---
name: critical-qa
description: >
  Runs a rigorous, self-adversarial QA audit before declaring any task complete.
  Ensures all changes are structurally sound, performant, secure, and handle edge cases correctly.
  Triggers when: user asks to verify a feature, finalize a task, or when you are about to complete a complex code change.
---

# Critical QA — Adversarial Quality Audit

Act as a critical, adversarial QA engineer. Before declaring any implementation, bug fix, or task complete, run a "hostile-reviewer" pass to stress-test your own work.

## Quality Audit Checklist

Review your implementation against the following axes:

1. **Failure Modes & Exception Handling:**
   - What happens if dependencies fail, databases timeout, or APIs return errors?
   - Are try-catch blocks scoped correctly, and do they fail gracefully?

2. **Boundary & Edge Cases:**
   - How does the code handle null/undefined values, empty objects/arrays, or boundary bounds?
   - Have you tested input validation?

3. **Performance & Memory Leaks:**
   - Does this change introduce O(N^2) loops or resource leaks?
   - Are DB queries optimized and connection pools properly managed?

4. **Security & Data Privacy:**
   - Is there any SQL Injection, XSS, or lack of authorization checks?
   - Are secrets or sensitive data leaked in logs or error messages?

## Verification Output

Document the audit by listing:
- **Potential Vulnerabilities / Weak Points:** What you discovered.
- **Verification Strategy:** How you verified or will verify it (tests, scripts, logs).
- **Mitigation:** The changes made to resolve the issues.
