---
name: find-skill
description: Use this skill when the user wants to search, find, install, update, or list skills available on the internet or local directories to expand agent capabilities.
---

# Find and Install Agent Skills

This skill governs the process of discovering, downloading, and installing new agent skills into the local workspace.

## Workflow

### 1. Search and Discovery
When the user asks to search for a skill (e.g., "find a web scraping skill" or "recommend the best skills for React"):
- Use the web search tool to find relevant repositories on GitHub or the official Anthropic skills repository (`anthropics/skills`).
- Look for directories containing a `SKILL.md` file.

### 2. Retrieval
- Once a relevant skill is identified, fetch the raw contents of the `SKILL.md` file from the remote repository (e.g., via `raw.githubusercontent.com`).
- Verify that the fetched file contains the standard YAML frontmatter with `name` and `description`.

### 3. Local Installation
- Create a new directory under `.agents/skills/<skill-name>/` in the local project workspace.
- Write the retrieved content into `.agents/skills/<skill-name>/SKILL.md` using the file creation tools.
- If there are supporting scripts under a `scripts/` directory, retrieve and write them to `.agents/skills/<skill-name>/scripts/` accordingly.

### 4. Verification and Discovery
- Verify that the folder and the `SKILL.md` file are correctly written.
- Inform the user of the successful installation. The custom agent framework will automatically discover and register the new skill since it resides in a standard customization root.
