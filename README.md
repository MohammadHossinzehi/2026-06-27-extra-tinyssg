# tinyssg

A dependency-free static site generator. Point it at a folder of Markdown
files and it produces a folder of static HTML pages plus an index — no
npm install, no build tooling, just `node build.js`.

## What it does

Most static site generators pull in a Markdown parser, a templating
engine, and a CLI framework as dependencies. tinyssg writes all three from
scratch in plain JavaScript, in under 350 lines total, so the whole
pipeline — frontmatter parsing, Markdown-to-HTML conversion, and
`{{placeholder}}` templating — is readable top to bottom in a few minutes.

For each `*.md` file in a content directory, tinyssg:

1. Splits off a small YAML-like frontmatter block (`title`, `date`,
   `description`).
2. Converts the Markdown body to HTML (headings, paragraphs, bold/italic,
   inline code, fenced code blocks, links, blockquotes, unordered lists).
3. Wraps the result in an HTML page template.
4. Writes `<name>.html` to the output directory, plus an `index.html`
   that links to every page, newest first by date.

## Project layout

- `frontmatter.js` — parses the `---`-delimited frontmatter block.
- `markdown.js` — the Markdown-to-HTML converter (the actual parser).
- `template.js` — minimal `{{key}}` string-substitution templating.
- `build.js` — the CLI: wires the above together and writes the output
  directory.
- `content/` — two example posts used as a working demo.
- `*.test.js` — unit tests for each module, runnable with Node's built-in
  test runner.

## How to run it

Requires only Node.js (tested on Node 22; no npm dependencies at all).

```bash
node build.js content dist
```

This builds the example posts in `content/` into `dist/`:

```
Built 2 page(s) from content into dist:
  - second-post.html  (A Second Post, 2026-06-25)
  - hello-world.html  (Hello, World, 2026-06-20)
Wrote index.html linking to all pages.
```

Arguments are optional — `node build.js` on its own defaults to
`./content` and `./dist`.

To run the test suite:

```bash
node --test
```

All 20 tests should pass.

## Design decisions

- **Zero dependencies, on purpose.** A Markdown parser and a templating
  engine are exactly the kind of thing it's easy to `npm install` without
  ever reading. Writing both from scratch keeps every transformation from
  source file to HTML visible and auditable in this repo alone.
- **A deliberately limited Markdown subset.** Full CommonMark compliance
  is a large spec with many edge cases (nested lists, reference-style
  links, HTML passthrough, etc.). tinyssg supports the subset that covers
  the overwhelming majority of real posts — headings, paragraphs,
  bold/italic, inline code, fenced code blocks, links, blockquotes, and
  flat unordered lists — and stays correct and readable rather than
  chasing 100% spec coverage.
- **Code spans are protected before bold/italic.** Inline code is matched
  and pulled out into placeholders *before* the bold/italic passes run, so
  something like `` `**not bold**` `` renders as literal text instead of
  being misinterpreted as emphasis.
- **Unknown template placeholders are left intact.** `template.js`
  deliberately doesn't replace a `{{key}}` it doesn't recognize with an
  empty string — a typo'd placeholder stays visible in the output instead
  of silently vanishing, which makes template bugs obvious immediately.
- **Testing strategy.** Each module has its own test file exercising it in
  isolation (`frontmatter.test.js`, `markdown.test.js`), plus
  `build.test.js`, which drives the whole pipeline end-to-end against
  temporary directories — including the empty-frontmatter fallback,
  date-sorted index ordering, and the missing-content-directory error
  path.
