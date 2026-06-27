'use strict';

/**
 * Minimal string-substitution templating: replaces {{key}} placeholders
 * with values from a data object. Unknown placeholders are left as-is
 * (rather than silently becoming empty strings) so a typo in a template
 * is obvious in the rendered output instead of disappearing.
 *
 * @param {string} templateStr
 * @param {Object<string,string>} data
 * @returns {string}
 */
function render(templateStr, data) {
  return templateStr.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
  });
}

const DEFAULT_PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{title}}</title>
  <meta name="description" content="{{description}}">
</head>
<body>
  <article>
    <h1>{{title}}</h1>
    <p><em>{{date}}</em></p>
    {{content}}
  </article>
</body>
</html>
`;

module.exports = { render, DEFAULT_PAGE_TEMPLATE };
