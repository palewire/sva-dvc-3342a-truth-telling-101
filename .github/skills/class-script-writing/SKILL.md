---
name: class-script-writing
description: Guides writing weekly class script files (.svx) for the Truth-Telling 101 syllabus. Use this when asked to write, draft, or create a new week's script content.
---

# Class Script Writing

Write weekly class script files (`.svx`) that match the established patterns, tone, and formatting conventions of "Truth-Telling 101: Artists Meet Data Journalism" at SVA. This approach is adapted from the sister CUNY "Coding the News" course — see its `class-script-writing` skill for the original pattern — but uses SVA's own frontmatter, components and design tokens.

## When to Use

Use this skill when asked to:

- Write a new week's script content
- Draft or outline a class session
- Expand an outline into a full hands-on script

## Reference Materials

Before writing, consult:

- **`src/content/homepage.yaml`** - `schedule.weeks` lists each week's date and topic, and only gets an `href` once the matching `.svx` page is ready. Do not add the `href` until the script is complete.
- **`src/content/weeks/week-1.svx`** - Example of a lecture-style week (slide deck embed + class outline + homework)

## File Structure

### Location

Save scripts to `src/content/weeks/week-{N}.svx`

### Frontmatter (Required)

```yaml
---
title: 'Descriptive Title'
summary: 'Brief description of what students will learn'
week: N
---
```

- **title**: Short, memorable phrase (not "Week N")
- **summary**: One sentence describing the main skills/concepts
- **week**: Integer week number

Unlike the CUNY course, there is no `date` or `locked` field — the date is pulled from `homepage.yaml`'s `schedule.weeks`, and a week is "locked" simply by not having an `href` yet.

### Script Block

Only include a `<script>` block if the page actually uses a component:

```svelte
<script>
  import Screenshot from '$lib/components/Screenshot.svelte';
</script>
```

Omit it entirely for simple lecture weeks that don't need one (see `week-1.svx`).

## Content Structure

### Two script styles

**Lecture/discussion weeks** (like week 1): keep it light — a slide deck `<iframe>`, a numbered `## Class outline`, and a numbered `## Homework` list. No Parts, no screenshots.

**Hands-on weeks** (spreadsheets, tools, exercises): follow the CUNY pattern below.

### Parts

Use `## Part N: Title` for major sections. Typically 3-4 parts per week.

```markdown
## Part 1: Introduction to [Topic]

## Part 2: Setting Up [Tool]

## Part 3: Practicing with Real Data
```

### Subheadings

Use `### Subtopic` for steps within parts.

### Homework Section

End hands-on weeks with `## Homework Assignments` containing 2-3 tasks:

```markdown
## Homework Assignments

### Task 1: Creating

[Hands-on practice]

### Task 2: Exploring

[Research or exploration]

### Task 3: Presenting

[Prepare to share findings with class]
```

## Writing Style

### Voice

- **Conversational but instructional** - second person, direct commands ("Open your browser", "Click the button")
- **Encouraging** - "Congratulations!", "Don't worry about that one"
- Explain **why**, not just **how**; use relatable analogies

### UI Element References

**Use quotes, not bold**, for UI elements:

- Good: `Click the "Clone repository" button`
- Avoid: `Click the **Clone repository** button`

### Code Formatting

**Inline code** for file names, commands, and short code: `` `README.md` ``, `` `npm install` ``.

**Fenced code blocks** with language hints. Shiki (via mdsvex) syntax-highlights these automatically and adds a copy button:

````markdown
```bash
npm run dev
```
````

Line highlighting is supported with `{1,3,5-7}` or `{emphasize-lines="1,3"}` meta after the language.

### Links

Standard Markdown links: `[GitHub's guide to Markdown](https://docs.github.com/...)`. For inline external links you want to open in a new tab, use `<a href="..." target="_blank">`.

### MDsveX Parsing Pitfalls

Since `.svx` files are processed by MDsveX, `<` and `>` in prose are interpreted as Svelte component tags and will break the build:

- Good: `under 600px`, `greater than 900px`
- Avoid: `< 600px`, `> 900px`

This applies outside of fenced code blocks only — code blocks and inline code are safe.

## Screenshots

Use the `Screenshot` component for hands-on weeks, same API as the CUNY course:

**Browser content:**

```svelte
<Screenshot
  src="/screenshots/week-2/google-sheets-homepage.png"
  alt="Google Sheets homepage showing the blank spreadsheet template"
  chromeTitle="Google Sheets"
  chromeUrl="https://sheets.google.com"
/>
```

**Desktop applications or non-browser UI:**

```svelte
<Screenshot
  src="/screenshots/week-2/sheets-filter-applied.png"
  alt="Spreadsheet with a filter applied to the revenue column"
  showChrome={false}
/>
```

### File Organization

- Save to `static/screenshots/week-{N}/`
- Use descriptive kebab-case names: `sheets-pivot-table.png`, not `step3.png`
- Write descriptive alt text, not just `"Screenshot"`

## Design Tokens

SVA's design system differs from CUNY's — use these tokens, not CUNY's `--color-*` or Trade Gothic equivalents:

- Fonts: `--font-body` (Ringside), `--font-ui` (Ringside Compressed), `--font-display` (Ringside Extra Wide)
- Colors: `--sva-red`, `--sva-charcoal`, `--sva-copy`, `--surface`, `--rule`, `--white`
- `.week-body` already styles `h2`/`h3`, lists, inline `code`, `pre` code blocks, the copy button, and tables — no need to add inline styles in script content.

## Checklist Before Submitting

- [ ] Frontmatter has `title`, `summary`, `week` (no `date`/`locked`)
- [ ] Script block only present if a component is actually used
- [ ] Hands-on weeks use `## Part N` / `### Subtopic` structure; lecture weeks stay simple
- [ ] UI elements use "quotes" not **bold**
- [ ] Code blocks have language hints
- [ ] Screenshots have descriptive alt text and correct `showChrome` setting
- [ ] No stray `<` or `>` characters in prose
- [ ] Homework section included
- [ ] `homepage.yaml`'s matching week only gets an `href` once the page is ready
