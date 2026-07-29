#!/usr/bin/env node
/**
 * ats-check.mjs — extracts the text layer from public/resume.pdf the same way an
 * Applicant Tracking System would, prints it in reading order, and runs a few
 * quick sanity checks. Run with:  npm run ats
 *
 * If the output looks clean and ordered, an ATS can parse your resume. If it's
 * empty or scrambled, the PDF isn't machine-readable.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PDF_PATH = join(ROOT, 'public', 'resume.pdf');

const { getDocument, VerbosityLevel } = await import('pdfjs-dist/legacy/build/pdf.mjs');

const data = new Uint8Array(readFileSync(PDF_PATH));
const doc = await getDocument({ data, verbosity: VerbosityLevel.ERRORS }).promise;

const pages = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const { items } = await page.getTextContent();
  // Group text fragments by vertical position (a "line"), top-to-bottom, then
  // left-to-right — this reconstructs the reading order a parser follows.
  const lines = new Map();
  for (const it of items) {
    if (!it.str) continue;
    const y = Math.round(it.transform[5]);
    if (!lines.has(y)) lines.set(y, []);
    lines.get(y).push({ x: it.transform[4], s: it.str });
  }
  const text = [...lines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((p) => p.s).join('').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  pages.push(text);
}

const full = pages.join('\n');

console.log(`\nATS text extraction — ${relative(ROOT, PDF_PATH)}`);
console.log('─'.repeat(64));
pages.forEach((t, i) => {
  if (doc.numPages > 1) console.log(`\n===== page ${i + 1} =====`);
  console.log(t);
});
console.log('─'.repeat(64));

// ── Quick sanity checks ───────────────────────────────────────────────────────
const has = (re) => re.test(full);
const checks = [
  ['Text is machine-readable (not an image)', full.trim().length > 200],
  ['Fits 1 page', doc.numPages === 1],
  ['Email detected', has(/[\w.+-]+@[\w-]+\.\w+/)],
  ['Phone detected', has(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)],
  ['Section: Experience', has(/experience/i)],
  ['Section: Education', has(/education/i)],
  ['Section: Skills', has(/skills/i)],
];

console.log('\nSanity checks:');
let allPass = true;
for (const [label, ok] of checks) {
  if (!ok) allPass = false;
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
}
console.log(`\n${allPass ? '✅ Looks ATS-friendly.' : '⚠️  Some checks failed — review the output above.'}\n`);
process.exit(allPass ? 0 : 1);
