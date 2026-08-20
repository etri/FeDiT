# Agent Skills

General frontend coding guidelines, loaded **on demand**. Each skill is a directory with a `SKILL.md`; its `description` frontmatter lets Claude Code auto-load it when a task matches (only descriptions sit in context at all times — bodies load when triggered). Pull one in manually with `/<skill-name>`. The load-it-when registry lives in the root `CLAUDE.md`.

## What is (and isn't) a skill here

Skills encode **general, reusable conventions** for writing React/TypeScript code — the kind you'd want in any project. They are deliberately **portable**: no hardcoded repo paths, package names, or design tokens. They do **not** reproduce library/framework tutorials — for library APIs, consult Context7. Cross-cutting always-on style lives in `.claude/rules/house-style.md`.

## Authoring conventions

- Keep each skill to a single `SKILL.md`; move long reference material into a sibling file only when it would otherwise bloat the body, and link it.
- Write the `description` to say **what it covers and when to use it**, with concrete trigger keywords.
- Keep skills general and portable. Repo-specific facts belong in code or `CLAUDE.md`, not here.
- Don't create a skill that just restates library docs or generic best practices — for library APIs, consult Context7.
