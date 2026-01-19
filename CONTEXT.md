# CONTEXT.md - LLM Reference for Malloy Documentation Repository

This file contains essential context for LLMs working with this codebase that is not covered in existing documentation files.

## Project Overview

This is the **documentation repository** for [Malloy](https://github.com/malloydata/malloy), a semantic data modeling and query language. It is also the source for the Malloy blog.

- **Live site:** https://docs.malloydata.dev
- **Repository:** https://github.com/malloydata/malloydata.github.io
- **Build system:** Entirely custom TypeScript-based static site generator (not Jekyll, Hugo, etc.)

## The .malloynb File Format (CRITICAL)

The `.malloynb` extension stands for "Malloy Notebook" and uses a **custom format** parsed by `MalloySQLParser`. This is NOT standard markdown with fenced code blocks.

### Syntax

Content is separated by `>>>` delimiters:

```
>>>markdown
# Heading

Regular markdown content here.

>>>malloy
source: flights is duckdb.table('flights.parquet')

>>>markdown
More markdown content.

>>>malloy
run: flights -> { aggregate: count() }
```

### Key Points

1. **`>>>markdown`** - Markdown content block
2. **`>>>malloy`** - Malloy code block (will be executed during build)
3. **`>>>sql`** - SQL code block
4. The parser treats these as "statements" in a notebook, not fenced code blocks
5. Within markdown blocks, standard fenced code blocks (triple backticks) can be used for non-executable code examples
6. YAML frontmatter at the very beginning is optional: `---\nlayout: documentation\n---`

### Code Execution

All Malloy code blocks are **executed at build time** using DuckDB. The query results are embedded in the generated HTML. This means:
- All Malloy code must be valid and runnable
- Sample data must exist for queries to work
- Build failures will occur if Malloy code has errors

## Documentation Directives

See README.md for the full list of `#(docs)` options. Key additional detail:

- **`#(docs)`** (single `#`) - Query-level directives, applies to the query in this block
- **`##(docs)`** (double `#`) - Model-level directives, applies to the model/source definition

## Build System Architecture

### Entry Point & Scripts

- **Main build:** `scripts/index.ts` (run via `tsx`)
- **Document rendering:** `scripts/render_document.ts`
- **Code execution:** `scripts/run_code.ts` (uses DuckDB)
- **Syntax highlighting:** `scripts/highlighter.ts` (uses Shiki)
- **Page structure/TOC:** `scripts/page.ts`

### Build Process

1. Register Handlebars partials from `/includes/`
2. Load layouts from `/layouts/`
3. Parse `table_of_contents.json` and `blog_posts.json`
4. For each `.malloynb` file:
   - Parse with `MalloySQLParser`
   - Execute all Malloy code blocks via DuckDB
   - Render results as HTML
   - Apply Handlebars template
   - Validate links
5. Generate search index (`js/generated/search_segments.js`)
6. Copy Malloy render library to output

### Watch Mode

The system tracks dependencies between documents and model files. Changing `flights.malloy` only rebuilds documents that import it (tracked via `DEPENDENCIES` map in `run_code.ts`).

## Sample Data & Models

### Location

- **Malloy models:** `/models/` directory
- **Parquet data files:** `/src/documentation/data/`

### Primary Models

| Model | Description |
|-------|-------------|
| `flights.malloy` | FAA flight data - primary example model |
| `airports.malloy` | Airport reference data |
| `carriers.malloy` | Airline carrier data |
| `ecommerce.malloy` | E-commerce example |
| `aircraft.malloy` | Aircraft details |

### Styles Files

`.styles.json` files alongside models define visualization defaults (e.g., `flights.styles.json`).

## Template System

### Handlebars Templates

- **Layouts:** `/layouts/` - page templates (`documentation.html`, `blog.html`, etc.)
- **Partials:** `/includes/` - reusable fragments (`banner.html`, `ga.html`)

### Available Context Variables

In templates and frontmatter:

| Variable | Description |
|----------|-------------|
| `{{ site.baseurl }}` | Base URL for the site |
| `{{ site.malloyRenderVersion }}` | Version of malloy-render library |
| `{{ page.title }}` | Page title |
| `{{ page.content }}` | Rendered page content |
| `{{ page.url }}` | Page URL path |
| `{{ page.footer }}` | Footer navigation HTML |

## Link Validation Rules

The build system validates all links. Key rules:

1. **Markdown links** (`[text](url)`) to internal docs MUST end with `.malloynb`
   - Correct: `[Sources](./source.malloynb)`
   - Wrong: `[Sources](./source)` or `[Sources](./source.html)`

2. **HTML links** (`<a href="">`) to internal docs MUST NOT include file extension
   - Correct: `<a href="/documentation/language/source">`
   - Wrong: `<a href="/documentation/language/source.html">`

3. **Hash anchors** are validated against actual heading IDs
4. **External links** (http/https) are not validated
5. **Absolute internal links** (starting with `/`) are discouraged except for `/slack`

## Blog Conventions

### Directory Structure

```
src/blog/
  YYYY-MM-DD-slug/
    index.malloynb    # Blog post content
    image.png         # Optional images
    ...
```

### Metadata

Blog posts must be registered in `/src/blog_posts.json`:

```json
{
  "title": "Post Title",
  "path": "/YYYY-MM-DD-slug",
  "author": "Author Name",
  "published": "YYYY-MM-DD",
  "subtitle": "Optional subtitle",
  "previewImage": "optional-preview.png"
}
```

Posts are automatically sorted by date (newest first). Navigation links (next/previous) are auto-generated.

## Table of Contents

Documentation navigation is defined in `/src/table_of_contents.json`:

```json
{
  "contents": [
    {
      "title": "Section Name",
      "items": [
        { "title": "Page Title", "link": "/path/to/page.malloynb" },
        { "title": "Nested Section", "items": [...] }
      ]
    }
  ]
}
```

The TOC generates:
- Sidebar navigation
- Footer prev/next links
- Page titles

## CI/CD Pipeline

See README.md for deploy instructions. Workflow details:

- **`.github/workflows/test.yaml`** - Runs `build-prod` on all PRs (must pass to merge)
- **`.github/workflows/publish.yaml`** - On push to `main`, builds and force-pushes to `docs-release` branch
- The `docs-release` branch contains only the built `/docs/` directory + `CNAME` file

## Style Conventions

See README.md for basic style rules. Additional details:

- **Meta-variables** in documentation use `<<variable>>` syntax (highlighted specially by the build system)
- Code blocks should NOT have leading/trailing blank lines (build will warn)

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@malloydata/malloy` | Core Malloy compiler |
| `@malloydata/render` | Result rendering (HTML tables, charts) |
| `@malloydata/db-duckdb` | DuckDB connection for code execution |
| `@malloydata/malloy-sql` | MalloySQL parser (parses .malloynb files) |
| `@malloydata/syntax-highlight` | TextMate grammar for Malloy |
| `shiki` | Syntax highlighting engine |
| `handlebars` | Template engine |
| `remark-*` | Markdown parsing |

## Cell Numbering

The build system tracks "cells" for linking to the GitHub web editor:

- Markdown blocks and Malloy blocks each count as cells
- Cell numbering starts at 1
- Links like `#C3` point to specific cells
- Used for "Open in VSCode" links in rendered docs

## Common Gotchas

1. **All Malloy code runs at build time** - errors in Malloy code break the build
2. **Link validation is strict** - builds fail on broken internal links
3. **The `.malloynb` format is NOT standard markdown** - use `>>>malloy` blocks, not fenced code blocks
4. **`##(docs) hidden`** must be on a Malloy block, not markdown
5. **DuckDB connections are per-directory** - relative paths in Malloy are relative to the doc's directory

## Malloy Package Updates

To update Malloy packages:

```bash
npm run malloy-update        # Latest stable
npm run malloy-update-next   # Next/preview version
```

For local development with linked Malloy packages:

```bash
npm run malloy-link    # Link local @malloydata packages
npm run malloy-unlink  # Unlink and reinstall from npm
```

## Output Structure

Generated output goes to `/docs/` (gitignored):

```
docs/
  documentation/
    language/
      query.html      # From query.malloynb
      ...
  blog/
    YYYY-MM-DD-slug/
      index.html
    index.html        # Blog index
  css/
  js/
    generated/
      search_segments.js
      malloy-render-X.X.X.js
  img/
  CNAME               # Added during deploy
```

## File Type Summary

| Extension | Description |
|-----------|-------------|
| `.malloynb` | Malloy Notebook - documentation source |
| `.malloy` | Malloy model file |
| `.styles.json` | Visualization style definitions |
| `.parquet` | Sample data files |
| `.html` | Layout/partial templates or static HTML |
