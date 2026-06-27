'use strict';

/**
 * A from-scratch, dependency-free Markdown-to-HTML converter.
 *
 * This intentionally supports a useful subset of Markdown rather than the
 * full CommonMark spec: ATX headings (#..######), fenced code blocks
 * (```lang ... ```), unordered lists (-, *, +), blockquotes (>), inline
 * code (`...`), bold (**...** or __...__), italic (*...* or _..._), links
 * ([text](url)), and paragraphs separated by blank lines. That covers the
 * vast majority of real-world blog posts and docs while staying readable
 * in a single file.
 *
 * @param {string} markdown
 * @returns {string} HTML
 */
function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks = [];

  let i = 0;
  let listBuffer = null; // { tag: 'ul', items: [...] }
  let paragraphBuffer = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      htmlBlocks.push(`<p>${renderInline(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    }
  }

  function flushList() {
    if (listBuffer) {
      const items = listBuffer.items
        .map((item) => `  <li>${renderInline(item)}</li>`)
        .join('\n');
      htmlBlocks.push(`<ul>\n${items}\n</ul>`);
      listBuffer = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    const fenceMatch = line.match(/^```(\w*)\s*$/);
    if (fenceMatch) {
      flushParagraph();
      flushList();
      const lang = fenceMatch[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const escaped = escapeHtml(codeLines.join('\n'));
      const langAttr = lang ? ` class="language-${lang}"` : '';
      htmlBlocks.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      htmlBlocks.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushList();
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      htmlBlocks.push(`<blockquote><p>${renderInline(quoteLines.join(' '))}</p></blockquote>`);
      continue;
    }

    const listMatch = line.match(/^[-*+]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      if (!listBuffer) listBuffer = { tag: 'ul', items: [] };
      listBuffer.items.push(listMatch[1]);
      i++;
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      i++;
      continue;
    }

    flushList();
    paragraphBuffer.push(line.trim());
    i++;
  }

  flushParagraph();
  flushList();

  return htmlBlocks.join('\n');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text) {
  const escaped = escapeHtml(text);
  const placeholders = [];

  let withPlaceholders = escaped.replace(/`([^`]+)`/g, (_, code) => {
    placeholders.push(`<code>${code}</code>`);
    return ` ${placeholders.length - 1} `;
  });

  withPlaceholders = withPlaceholders.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );

  withPlaceholders = withPlaceholders.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  withPlaceholders = withPlaceholders.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  withPlaceholders = withPlaceholders.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  withPlaceholders = withPlaceholders.replace(/_([^_]+)_/g, '<em>$1</em>');

  withPlaceholders = withPlaceholders.replace(/ (\d+) /g, (_, idx) => placeholders[Number(idx)]);

  return withPlaceholders;
}

module.exports = { markdownToHtml, escapeHtml, renderInline };
