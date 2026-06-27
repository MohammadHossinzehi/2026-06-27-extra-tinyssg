'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { markdownToHtml, escapeHtml, renderInline } = require('./markdown');

test('renders ATX headings at all six levels', () => {
  for (let level = 1; level <= 6; level++) {
    const hashes = '#'.repeat(level);
    const html = markdownToHtml(`${hashes} Title`);
    assert.equal(html, `<h${level}>Title</h${level}>`);
  }
});

test('renders a paragraph with bold, italic, and inline code', () => {
  const html = markdownToHtml('This is **bold**, *italic*, and `code`.');
  assert.equal(
    html,
    '<p>This is <strong>bold</strong>, <em>italic</em>, and <code>code</code>.</p>'
  );
});

test('does not mangle markdown syntax characters inside inline code', () => {
  const html = markdownToHtml('Use `**not bold**` literally.');
  assert.equal(html, '<p>Use <code>**not bold**</code> literally.</p>');
});

test('renders links', () => {
  const html = markdownToHtml('[Anthropic](https://anthropic.com)');
  assert.equal(html, '<p><a href="https://anthropic.com">Anthropic</a></p>');
});

test('renders an unordered list from -, *, and + markers', () => {
  const html = markdownToHtml('- one\n* two\n+ three');
  assert.equal(html, '<ul>\n  <li>one</li>\n  <li>two</li>\n  <li>three</li>\n</ul>');
});

test('renders a fenced code block and escapes its contents', () => {
  const html = markdownToHtml('```js\nconst x = "<b>";\n```');
  assert.equal(html, '<pre><code class="language-js">const x = &quot;&lt;b&gt;&quot;;</code></pre>');
});

test('renders a blockquote', () => {
  const html = markdownToHtml('> quoted text');
  assert.equal(html, '<blockquote><p>quoted text</p></blockquote>');
});

test('merges consecutive non-blank lines into a single paragraph', () => {
  const html = markdownToHtml('line one\nline two\n\nline three');
  assert.equal(html, '<p>line one line two</p>\n<p>line three</p>');
});

test('escapeHtml escapes all five significant characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'</a>`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});

test('renderInline escapes raw HTML before applying markdown', () => {
  assert.equal(renderInline('<script>'), '&lt;script&gt;');
});
