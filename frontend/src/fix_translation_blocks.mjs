import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appJsxPath = join(__dirname, 'App.jsx');

const content = readFileSync(appJsxPath, 'utf8');
const lines = content.split('\n');

const knownLangs = new Set([
  'English', 'Chinese', 'Japanese', 'Arabic', 'German', 'French',
  'Urdu', 'Spanish', 'Portuguese', 'Italian', 'Korean', 'Hindi',
  'Turkish', 'Russian'
]);

// Find all language block headers
const blockStarts = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^\s+(\w[\w\s]*?):\s*\{$/);
  if (m && knownLangs.has(m[1].trim())) {
    blockStarts.push({ idx: i, name: m[1].trim() });
  }
}

console.log('Current blocks:');
blockStarts.forEach(b => console.log(`  ${b.name}: line ${b.idx}`));

// Find duplicate blocks (same language appearing consecutively)
const duplicates = [];
for (let i = 1; i < blockStarts.length; i++) {
  if (blockStarts[i].name === blockStarts[i - 1].name) {
    duplicates.push({
      lang: blockStarts[i].name,
      firstStart: blockStarts[i - 1].idx,
      secondStart: blockStarts[i].idx,
    });
  }
}

console.log(`\nFound ${duplicates.length} duplicate blocks`);

// For each duplicate, remove the FIRST (incomplete) block
// Keep the SECOND (complete) block but use its header
for (const dup of duplicates.reverse()) {
  // Find the end of the first block (line before the second block header)
  let firstBlockEnd = dup.secondStart - 1;
  // Remove empty lines before second header
  while (firstBlockEnd > dup.firstStart && lines[firstBlockEnd].trim() === '') {
    firstBlockEnd--;
  }

  // Remove lines from firstStart to secondStart - 1 (the incomplete first block)
  // This removes: "  LangName: {", content lines, empty lines, up to but not including the second header
  const removeStart = dup.firstStart;
  const removeEnd = dup.secondStart; // exclusive

  // But we need to also remove the duplicate header line (secondStart)
  // and keep only one. Actually, let's remove the first block AND the duplicate header.
  // Keep the second block's content but it already has its own header at secondStart.

  // Remove from firstStart to secondStart (inclusive of the duplicate header)
  // Wait no - we want to keep the second block. So remove from firstStart to secondStart-1.
  // Actually: remove the first incomplete block (from firstStart to secondStart-1).
  // The second block header at secondStart stays.

  // But first, check if there's a "}," that needs to be removed too
  // The first block might have a "}," that was added by the fix script
  // Look at the line just before secondStart
  let checkLine = dup.secondStart - 1;
  while (checkLine > dup.firstStart && lines[checkLine].trim() === '') checkLine--;

  // Remove from firstStart to secondStart (exclusive)
  const removed = lines.splice(removeStart, removeEnd - removeStart);
  console.log(`Removed ${removed.length} lines for duplicate ${dup.lang} (was lines ${removeStart}-${removeEnd - 1})`);
}

// Now check for missing closings
// Re-find block starts after removals
const finalContent = lines.join('\n');
const finalLines = finalContent.split('\n');

const finalBlockStarts = [];
for (let i = 0; i < finalLines.length; i++) {
  const m = finalLines[i].match(/^\s+(\w[\w\s]*?):\s*\{$/);
  if (m && knownLangs.has(m[1].trim())) {
    finalBlockStarts.push({ idx: i, name: m[1].trim() });
  }
}

console.log(`\nAfter dedup, ${finalBlockStarts.length} blocks:`);
finalBlockStarts.forEach(b => console.log(`  ${b.name}: line ${b.idx}`));

// Check each block has proper closing
const missingClosings = [];
for (let bi = 0; bi < finalBlockStarts.length; bi++) {
  const start = finalBlockStarts[bi].idx;
  const end = bi + 1 < finalBlockStarts.length
    ? finalBlockStarts[bi + 1].idx
    : null;

  if (end === null) {
    // Last block - find "};"
    for (let i = start + 1; i < finalLines.length; i++) {
      if (finalLines[i].trim() === '};') {
        let prev = i - 1;
        while (prev > start && finalLines[prev].trim() === '') prev--;
        if (!finalLines[prev].trim().endsWith('},') && finalLines[prev].trim() !== '},') {
          missingClosings.push({ after: prev, lang: finalBlockStarts[bi].name });
        }
        break;
      }
    }
  } else {
    let prev = end - 1;
    while (prev > start && finalLines[prev].trim() === '') prev--;
    if (!finalLines[prev].trim().endsWith('},') && finalLines[prev].trim() !== '},') {
      missingClosings.push({ after: prev, lang: finalBlockStarts[bi].name });
    }
  }
}

console.log(`\nMissing closings: ${missingClosings.length}`);
missingClosings.forEach(c => console.log(`  ${c.lang} after line ${c.after}`));

// Apply missing closings (bottom to top)
missingClosings.sort((a, b) => b.after - a.after);
for (const c of missingClosings) {
  finalLines.splice(c.after + 1, 0, '  },');
}

// Check for missing headers (headerless blocks)
// These are blocks where content exists between two language blocks without a header
// Actually, after dedup, all blocks should have headers. Let me verify by checking
// if there are any "// Navigation & System" comments that aren't inside a proper block.

const resultContent = finalLines.join('\n');
const resultLines = resultContent.split('\n');

// Final verification: check all language blocks
const verifyStarts = [];
for (let i = 0; i < resultLines.length; i++) {
  const m = resultLines[i].match(/^\s+(\w[\w\s]*?):\s*\{$/);
  if (m && knownLangs.has(m[1].trim())) {
    verifyStarts.push({ idx: i, name: m[1].trim() });
  }
}

console.log(`\nFinal verification - ${verifyStarts.length} blocks:`);
verifyStarts.forEach(b => console.log(`  ${b.name}: line ${b.idx}`));

// Write result
const final = resultLines.join('\n');
writeFileSync(appJsxPath, final, 'utf8');
console.log(`\nDone! File: ${resultLines.length} lines`);
