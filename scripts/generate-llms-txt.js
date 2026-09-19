#!/usr/bin/env node
/**
 * Generates public/llms.txt from the same data the "machine mode" page renders.
 *
 * src/data.js and src/llmsText.js are ES modules inside a CommonJS package, so
 * instead of importing them we strip their import/export keywords and evaluate
 * the two sources together. They are plain data + string building with no
 * runtime dependencies, which keeps this safe and dependency-free.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const strip = (source) =>
  source
    .replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+/gm, '');

const body = [
  strip(read('src/data.js')),
  strip(read('src/llmsText.js')),
  'return buildLlmsText(contact);',
].join('\n');

// eslint-disable-next-line no-new-func
const text = new Function(body)();

const outPath = path.join(root, 'public', 'llms.txt');
fs.writeFileSync(outPath, text.endsWith('\n') ? text : text + '\n', 'utf8');
console.log(`Wrote ${path.relative(root, outPath)} (${text.length} chars)`);
