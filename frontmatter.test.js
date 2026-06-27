'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseFrontmatter } = require('./frontmatter');

test('parses key/value pairs and strips the block from the body', () => {
  const raw = '---\ntitle: My Post\ndate: 2026-06-27\n---\n# Body\n';
  const { data, body } = parseFrontmatter(raw);
  assert.deepEqual(data, { title: 'My Post', date: '2026-06-27' });
  assert.equal(body, '# Body\n');
});

test('strips matching surrounding quotes from values', () => {
  const raw = '---\ntitle: "Hello: World"\n---\nbody\n';
  const { data } = parseFrontmatter(raw);
  assert.equal(data.title, 'Hello: World');
});

test('returns the whole file as body when there is no frontmatter', () => {
  const raw = '# Just a heading\n\nNo frontmatter here.\n';
  const { data, body } = parseFrontmatter(raw);
  assert.deepEqual(data, {});
  assert.equal(body, raw);
});

test('treats an unterminated block as plain body, not data', () => {
  const raw = '---\ntitle: Oops\n# no closing fence\n';
  const { data, body } = parseFrontmatter(raw);
  assert.deepEqual(data, {});
  assert.equal(body, raw);
});

test('ignores blank lines and lines without a colon inside the block', () => {
  const raw = '---\ntitle: My Post\n\nnotakeyvalueline\ndate: 2026-06-27\n---\nbody\n';
  const { data } = parseFrontmatter(raw);
  assert.deepEqual(data, { title: 'My Post', date: '2026-06-27' });
});
