'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { buildSite } = require('./build');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tinyssg-test-'));
}

test('builds one HTML file per markdown source plus an index', () => {
  const contentDir = makeTempDir();
  const outputDir = makeTempDir();

  fs.writeFileSync(
    path.join(contentDir, 'a.md'),
    '---\ntitle: A\ndate: 2026-01-01\n---\nBody A\n'
  );
  fs.writeFileSync(
    path.join(contentDir, 'b.md'),
    '---\ntitle: B\ndate: 2026-02-01\n---\nBody B\n'
  );

  const pages = buildSite(contentDir, outputDir);

  assert.equal(pages.length, 2);
  assert.ok(fs.existsSync(path.join(outputDir, 'a.html')));
  assert.ok(fs.existsSync(path.join(outputDir, 'b.html')));
  assert.ok(fs.existsSync(path.join(outputDir, 'index.html')));
});

test('sorts pages newest-first by date in the index', () => {
  const contentDir = makeTempDir();
  const outputDir = makeTempDir();

  fs.writeFileSync(path.join(contentDir, 'old.md'), '---\ntitle: Old\ndate: 2020-01-01\n---\nx\n');
  fs.writeFileSync(path.join(contentDir, 'new.md'), '---\ntitle: New\ndate: 2025-01-01\n---\nx\n');

  buildSite(contentDir, outputDir);
  const indexHtml = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');

  assert.ok(indexHtml.indexOf('New') < indexHtml.indexOf('Old'));
});

test('falls back to the filename as title when frontmatter has none', () => {
  const contentDir = makeTempDir();
  const outputDir = makeTempDir();

  fs.writeFileSync(path.join(contentDir, 'untitled.md'), 'Just a body, no frontmatter.\n');

  buildSite(contentDir, outputDir);
  const html = fs.readFileSync(path.join(outputDir, 'untitled.html'), 'utf8');

  assert.ok(html.includes('<title>untitled</title>'));
});

test('throws a clear error when the content directory does not exist', () => {
  const outputDir = makeTempDir();
  assert.throws(() => buildSite('/no/such/dir', outputDir), /Content directory not found/);
});

test('ignores non-markdown files in the content directory', () => {
  const contentDir = makeTempDir();
  const outputDir = makeTempDir();

  fs.writeFileSync(path.join(contentDir, 'post.md'), '---\ntitle: Post\n---\nbody\n');
  fs.writeFileSync(path.join(contentDir, 'notes.txt'), 'should be ignored');

  const pages = buildSite(contentDir, outputDir);
  assert.equal(pages.length, 1);
});
