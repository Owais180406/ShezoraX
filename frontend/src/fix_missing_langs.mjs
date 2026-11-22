import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appJsxPath = join(__dirname, 'App.jsx');

const content = readFileSync(appJsxPath, 'utf8');
const lines = content.split('\n');

// 1. Add "Chinese: {" header before line 1729 (the "// Navigation & System" comment for Chinese)
// Find the line with "// Navigation & System" that contains "首页" nearby
let chineseHeaderIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '// Navigation & System' && i + 1 < lines.length && lines[i + 1].includes('首页')) {
    chineseHeaderIdx = i;
    break;
  }
}

if (chineseHeaderIdx === -1) {
  console.error('Could not find Chinese block start');
  process.exit(1);
}

console.log(`Found Chinese content at line ${chineseHeaderIdx}`);
lines.splice(chineseHeaderIdx, 0, '  Chinese: {');
console.log('Added "Chinese: {" header');

// 2. Insert Korean block between Chinese closing and Japanese header
// After insertion above, line numbers shifted by 1
// Find the Chinese closing "}," which should be followed by Japanese: {
let koreanInsertIdx = -1;
for (let i = chineseHeaderIdx; i < lines.length; i++) {
  if (lines[i].match(/^\s*Japanese:\s*\{$/)) {
    koreanInsertIdx = i;
    break;
  }
}

if (koreanInsertIdx === -1) {
  console.error('Could not find Japanese block for Korean insertion');
  process.exit(1);
}

// Read Korean translation file
const koreanFile = readFileSync(join(__dirname, 'translations_korean.txt'), 'utf8');
const koreanLines = koreanFile.split('\n');

// Remove header line ("Korean: {")
const headerIdx = koreanLines.findIndex(l => /^\s*\w+\s*:\s*\{/.test(l));
if (headerIdx !== -1) koreanLines.splice(0, headerIdx + 1);

// Remove trailing "},"
while (koreanLines.length > 0) {
  const last = koreanLines[koreanLines.length - 1].trim();
  if (last === '},' || last === '}' || last === '') {
    koreanLines.pop();
  } else break;
}

// Normalize Unicode in keys
const normalizedKorean = koreanLines.map(line => {
  const match = line.match(/^(\s*)"(.+)"(\s*:\s*".*")$/);
  if (match) {
    const [, indent, key, rest] = match;
    const normalizedKey = key
      .replace(/\u2026/g, '\\u2026')
      .replace(/\u2192/g, '\\u2192')
      .replace(/\u2190/g, '\\u2190')
      .replace(/\u00b7/g, '\\u00b7');
    return `${indent}"${normalizedKey}"${rest}`;
  }
  return line;
});

// Build Korean block
const koreanBlock = [
  '',
  '  Korean: {',
  ...normalizedKorean.map(l => l.startsWith('    ') ? l : '    ' + l.trimStart()),
  '  },',
];

console.log(`Inserting Korean block (${koreanBlock.length} lines) before line ${koreanInsertIdx}`);
lines.splice(koreanInsertIdx, 0, ...koreanBlock);

// Write result
const result = lines.join('\n');
writeFileSync(appJsxPath, result, 'utf8');
console.log(`Done! File: ${lines.length} lines`);

// Verify all 14 language blocks
const knownLangs = new Set([
  'English', 'Chinese', 'Japanese', 'Arabic', 'German', 'French',
  'Urdu', 'Spanish', 'Portuguese', 'Italian', 'Korean', 'Hindi',
  'Turkish', 'Russian'
]);

const finalLines = result.split('\n');
const blocks = [];
for (let i = 0; i < finalLines.length; i++) {
  const m = finalLines[i].match(/^\s+(\w[\w\s]*?):\s*\{$/);
  if (m && knownLangs.has(m[1].trim())) {
    blocks.push(m[1].trim());
  }
}

console.log(`\nAll ${blocks.length} language blocks: ${blocks.join(', ')}`);
