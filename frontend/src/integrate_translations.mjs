import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appJsxPath = join(__dirname, 'App.jsx');

const fileContent = readFileSync(appJsxPath, 'utf8');
const lines = fileContent.split('\n');

const translationsDir = __dirname;

const langFileMap = {
  Chinese: 'translations_chinese.txt',
  Japanese: 'translations_japanese.txt',
  Korean: 'translations_korean.txt',
  French: 'translations_french.txt',
  German: 'translations_german.txt',
  Spanish: 'translations_spanish.txt',
};

// Find UI_TRANSLATIONS start
const utStartIdx = lines.findIndex(l => l.includes('const UI_TRANSLATIONS = {'));
if (utStartIdx === -1) {
  console.error('Could not find UI_TRANSLATIONS');
  process.exit(1);
}

// For each language, find its block boundaries
const langBlocks = [];

for (const [langName, fileName] of Object.entries(langFileMap)) {
  const filePath = join(translationsDir, fileName);
  if (!existsSync(filePath)) {
    console.error(`Missing: ${fileName}`);
    process.exit(1);
  }

  // Find block start: line matching "  LangName: {"
  const startPattern = new RegExp(`^\\s*${langName}:\\s*\\{`);
  const startLineIdx = lines.findIndex((l, i) =>
    i > utStartIdx && startPattern.test(l)
  );

  if (startLineIdx === -1) {
    console.error(`Could not find ${langName} block`);
    process.exit(1);
  }

  // Find block end by tracking brace depth
  let depth = 0;
  let endLineIdx = -1;
  for (let i = startLineIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          endLineIdx = i;
          break;
        }
      }
    }
    if (endLineIdx !== -1) break;
  }

  if (endLineIdx === -1) {
    console.error(`Could not find end of ${langName} block`);
    process.exit(1);
  }

  // Read translation file
  let tfContent = readFileSync(filePath, 'utf8');
  const tfLines = tfContent.split('\n');

  // Remove header line ("LangName: {")
  const headerIdx = tfLines.findIndex(l => /^\s*\w+[\s]*:\s*\{/.test(l));
  if (headerIdx !== -1) {
    tfLines.splice(0, headerIdx + 1);
  }

  // Remove trailing "}," line (find last line that is just "},")
  while (tfLines.length > 0) {
    const last = tfLines[tfLines.length - 1].trim();
    if (last === '},' || last === '}' || last === '') {
      tfLines.pop();
    } else {
      break;
    }
  }

  // Normalize: convert literal Unicode chars in keys to \u escapes
  // so they match the English block key format
  const normalized = tfLines.map(line => {
    // Only process lines that look like key-value pairs
    // Match: "key": "value" or key: "value"
    const match = line.match(/^(\s*)"(.+)"(\s*:\s*".*")$/);
    if (match) {
      const [, indent, key, rest] = match;
      // Convert literal Unicode in key to escape sequences
      const normalizedKey = key
        .replace(/\u2026/g, '\\u2026')
        .replace(/\u2192/g, '\\u2192')
        .replace(/\u2190/g, '\\u2190')
        .replace(/\u00b7/g, '\\u00b7');
      return `${indent}"${normalizedKey}"${rest}`;
    }
    return line;
  });

  // Add proper indentation (4 spaces for content inside language block)
  const indentedContent = normalized.map(l => {
    if (l.trim() === '' || l.trim().startsWith('//')) return l;
    // Ensure 4-space indent
    if (!l.startsWith('    ') && l.trim().length > 0) {
      return '    ' + l.trimStart();
    }
    return l;
  });

  langBlocks.push({
    langName,
    startLineIdx,
    endLineIdx,
    newContent: indentedContent,
  });
}

// Sort blocks by startLineIdx descending so we can replace from bottom to top
// without invalidating earlier indices
langBlocks.sort((a, b) => b.startLineIdx - a.startLineIdx);

// Replace blocks
for (const block of langBlocks) {
  const before = lines.slice(0, block.startLineIdx);
  const after = lines.slice(block.endLineIdx + 1);
  lines.length = 0;
  lines.push(...before, ...block.newContent, ...after);
  console.log(`Replaced ${block.langName} (was lines ${block.startLineIdx}-${block.endLineIdx}, now ${block.newContent.length} lines)`);
}

// Write back
const result = lines.join('\n');
writeFileSync(appJsxPath, result, 'utf8');
console.log('Done! All 6 language blocks integrated.');
console.log(`File size: ${result.length} chars, ${lines.length} lines`);
