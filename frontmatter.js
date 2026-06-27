'use strict';

/**
 * Parses a tiny YAML-like frontmatter block from the top of a markdown file.
 *
 * Expected shape:
 *
 *   ---
 *   title: My Post
 *   date: 2026-06-27
 *   ---
 *   # Rest of the markdown body
 *
 * Only flat `key: value` pairs are supported (no nesting, no lists, no
 * multi-line values) -- that's all a static site generator's front matter
 * needs in practice, and it keeps this file dependency-free and under 40
 * lines.
 *
 * @param {string} raw - full contents of a source markdown file
 * @returns {{data: Object<string,string>, body: string}}
 */
function parseFrontmatter(raw) {
  const lines = raw.split('\n');

  if (lines[0] !== '---') {
    return { data: {}, body: raw };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    // Unterminated block -- treat the whole file as body rather than
    // silently swallowing content.
    return { data: {}, body: raw };
  }

  const data = {};
  for (const line of lines.slice(1, endIndex)) {
    if (line.trim() === '') continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    // Strip matching surrounding quotes, e.g. title: "Hello: World"
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  const body = lines.slice(endIndex + 1).join('\n');
  return { data, body };
}

module.exports = { parseFrontmatter };
