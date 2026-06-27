#!/usr/bin/env node
'use strict';

/**
 * CLI entry point: builds a directory of Markdown files into a directory
 * of static HTML files.
 *
 * Usage:
 *   node build.js [contentDir] [outputDir]
 *
 * Defaults to ./content -> ./dist.
 *
 * For each `*.md` file in contentDir, this:
 *   1. Splits off any frontmatter (title/date/description).
 *   2. Converts the remaining Markdown body to HTML.
 *   3. Wraps it in the page template.
 *   4. Writes the result as `<name>.html` in outputDir.
 * It also writes an index.html that links to every generated page,
 * sorted by date (newest first) when a date is present.
 */

const fs = require('fs');
const path = require('path');

const { parseFrontmatter } = require('./frontmatter');
const { markdownToHtml, escapeHtml } = require('./markdown');
const { render, DEFAULT_PAGE_TEMPLATE } = require('./template');

function buildSite(contentDir, outputDir) {
  if (!fs.existsSync(contentDir)) {
    throw new Error(`Content directory not found: ${contentDir}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(contentDir)
    .filter((name) => name.endsWith('.md'))
    .sort();

  const pages = [];

  for (const file of files) {
    const fullPath = path.join(contentDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data, body } = parseFrontmatter(raw);

    const slug = file.replace(/\.md$/, '');
    const title = data.title || slug;
    const date = data.date || '';
    const description = data.description || '';

    const contentHtml = markdownToHtml(body);
    const pageHtml = render(DEFAULT_PAGE_TEMPLATE, {
      title: escapeHtml(title),
      date: escapeHtml(date),
      description: escapeHtml(description),
      content: contentHtml,
    });

    const outPath = path.join(outputDir, `${slug}.html`);
    fs.writeFileSync(outPath, pageHtml, 'utf8');

    pages.push({ slug, title, date });
  }

  pages.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const indexItems = pages
    .map((p) => `  <li><a href="${p.slug}.html">${escapeHtml(p.title)}</a>${p.date ? ` — <em>${escapeHtml(p.date)}</em>` : ''}</li>`)
    .join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Site Index</title>
</head>
<body>
  <h1>Posts</h1>
  <ul>
${indexItems}
  </ul>
</body>
</html>
`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml, 'utf8');

  return pages;
}

function main() {
  const contentDir = process.argv[2] || path.join(__dirname, 'content');
  const outputDir = process.argv[3] || path.join(__dirname, 'dist');

  const pages = buildSite(contentDir, outputDir);

  console.log(`Built ${pages.length} page(s) from ${contentDir} into ${outputDir}:`);
  for (const p of pages) {
    console.log(`  - ${p.slug}.html  (${p.title}${p.date ? `, ${p.date}` : ''})`);
  }
  console.log(`Wrote index.html linking to all pages.`);
}

if (require.main === module) {
  main();
}

module.exports = { buildSite };
