/**
 * Fix mojibake in src/data/all_cases.json.
 * Root cause: at some point the file's UTF-8 bytes were decoded as single-byte
 * CP866 (each byte >= 0x80 became one stray char: box-drawing / Cyrillic lookalikes).
 * This script learns the exact byte->char mapping from pairs of
 * (correct text from all_cases.backup.json, corrupted text in all_cases.json)
 * matched by case/skin ID, then inverts the whole file text back to proper UTF-8.
 * Numbers (prices) are pure ASCII and pass through untouched.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../src/data');
const CUR_PATH = path.join(DIR, 'all_cases.json');
const BAK_PATH = path.join(DIR, 'all_cases.backup.json');

const curCases = JSON.parse(fs.readFileSync(CUR_PATH, 'utf8'));
const bakCases = JSON.parse(fs.readFileSync(BAK_PATH, 'utf8'));
const bakById = new Map(bakCases.map((c) => [c.id, c]));

const CASE_FIELDS = ['name', 'subtitle', 'nameEn', 'subtitleEn', 'badge', 'badgeEn'];
const SKIN_FIELDS = ['name', 'weapon', 'skinName', 'wearLabel'];

// 1. Collect (correct, corrupted) pairs
const pairs = [];
for (const c of curCases) {
  const b = bakById.get(c.id);
  if (!b) continue;
  for (const f of CASE_FIELDS) {
    if (typeof c[f] === 'string' && typeof b[f] === 'string') pairs.push([b[f], c[f], `case:${c.id}.${f}`]);
  }
  const bakSkins = new Map((b.skins || []).map((s) => [s.id, s]));
  for (const s of c.skins || []) {
    const bs = bakSkins.get(s.id);
    if (!bs) continue;
    for (const f of SKIN_FIELDS) {
      if (typeof s[f] === 'string' && typeof bs[f] === 'string') pairs.push([bs[f], s[f], `skin:${s.id}.${f}`]);
    }
  }
}
console.log(`Collected ${pairs.length} text pairs.`);

// 2. Learn byte -> char mapping
const byteToChar = new Map();
const conflicts = [];
let skipped = 0;
for (const [correct, corrupted, tag] of pairs) {
  const bytes = Buffer.from(correct, 'utf8');
  const chars = [...corrupted];
  if (bytes.length !== chars.length) { skipped++; continue; }
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const ch = chars[i];
    if (b < 0x80) {
      if (ch !== String.fromCharCode(b)) { conflicts.push(`${tag}: ascii mismatch`); }
      continue;
    }
    if (byteToChar.has(b) && byteToChar.get(b) !== ch) {
      conflicts.push(`${tag}: byte 0x${b.toString(16)} -> both ${JSON.stringify(byteToChar.get(b))} and ${JSON.stringify(ch)}`);
    } else {
      byteToChar.set(b, ch);
    }
  }
}
console.log(`Learned ${byteToChar.size} byte mappings, skipped pairs: ${skipped}, conflicts: ${conflicts.length}`);
for (const c of conflicts.slice(0, 10)) console.log('  CONFLICT:', c);
if (conflicts.length) { console.error('Mapping is not deterministic, aborting.'); process.exit(1); }

// 3. Check coverage: every non-ASCII char in current file must be invertible
const curText = fs.readFileSync(CUR_PATH, 'utf8');
const charToByte = new Map();
for (const [b, ch] of byteToChar) charToByte.set(ch, b);
const nonAscii = new Set([...curText].filter((c) => c.codePointAt(0) > 127));
const uncovered = [...nonAscii].filter((c) => !charToByte.has(c));
console.log(`Distinct non-ASCII chars in file: ${nonAscii.size}, uncovered by mapping: ${uncovered.length}`);
for (const c of uncovered.slice(0, 20)) console.log('  UNCOVERED:', JSON.stringify(c), 'U+' + c.codePointAt(0).toString(16));
if (uncovered.length) { console.error('Incomplete mapping, aborting.'); process.exit(1); }

// 4. Invert whole file text -> bytes -> proper UTF-8
const outBytes = [];
for (const ch of curText) {
  const cp = ch.codePointAt(0);
  if (cp < 128) outBytes.push(cp);
  else outBytes.push(charToByte.get(ch));
}
const fixed = Buffer.from(outBytes).toString('utf8');

// 5. Validate
const parsed = JSON.parse(fixed); // throws if broken
const boxLeft = (fixed.match(/[\u2500-\u257F]/g) || []).length;
console.log(`Parsed OK: ${parsed.length} cases, box-drawing chars left: ${boxLeft}`);

// Verify pairs whose lengths match (length-mismatched ones are genuine content
// diffs, e.g. current data added a "★ " prefix vs the older backup — audited benign)
const parsedById = new Map(parsed.map((c) => [c.id, c]));
let mismatches = 0;
let skippedVerify = 0;
for (const [correct, corrupted, tag] of pairs) {
  if (Buffer.from(correct, 'utf8').length !== [...corrupted].length) { skippedVerify++; continue; }
  // find field value in fixed file: re-derive by inverting corrupted
  const inv = Buffer.from([...corrupted].map((ch) => (ch.codePointAt(0) < 128 ? ch.codePointAt(0) : charToByte.get(ch)))).toString('utf8');
  if (inv !== correct) { mismatches++; if (mismatches <= 5) console.log('  MISMATCH:', tag, JSON.stringify(inv), '!==', JSON.stringify(correct)); }
}
console.log(`Pair round-trip mismatches: ${mismatches}/${pairs.length} (skipped content-diffs: ${skippedVerify})`);

// Spot check against known-good strings
const arab = parsedById.get('case-arabesque-2026');
console.log('arabesque name:', arab && arab.name);

if (boxLeft === 0 && mismatches === 0) {
  fs.writeFileSync(CUR_PATH, fixed, 'utf8');
  console.log('Wrote fixed file.');
} else {
  console.error('Validation failed, file NOT written.');
  process.exit(1);
}
