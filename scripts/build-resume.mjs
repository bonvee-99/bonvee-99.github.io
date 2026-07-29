#!/usr/bin/env node
/**
 * build-resume.mjs — turns resume.md (the single source of truth) into:
 *   • src/scripts/resume.js  (data the website imports)
 *   • public/resume.pdf      (the downloadable PDF)
 *
 * Usage:
 *   node scripts/build-resume.mjs            # regenerate both JS + PDF
 *   node scripts/build-resume.mjs --js-only  # regenerate only resume.js (no browser needed)
 *
 * The parser is deterministic and dependency-free. The PDF step lazily imports
 * Playwright, so --js-only works in CI without a browser installed.
 *
 * See resume.md's top comment for the exact format the parser expects.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inline } from '../src/scripts/inline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MD_PATH = join(ROOT, 'resume.md');
const JS_PATH = join(ROOT, 'src', 'scripts', 'resume.js');
const PDF_PATH = join(ROOT, 'public', 'resume.pdf');

// A date range is "Start – End"; split on a dash (en/em/hyphen) surrounded by spaces.
function splitDateRange(str) {
  const [start = '', end = ''] = str.split(/\s[–—-]\s/);
  return { startDate: start.trim(), endDate: end.trim() };
}

// ── Parse ────────────────────────────────────────────────────────────────────
function parseResume(md) {
  const clean = md.replace(/<!--[\s\S]*?-->/g, ''); // drop HTML comments (format docs)
  const lines = clean.split(/\r?\n/);

  const resume = {
    name: '',
    location: '',
    phone: '',
    email: '',
    links: { portfolio: '', github: '', linkedin: '' },
    workExperience: [],
    projects: [],
    education: {},
    skills: {},
  };

  const CONTACT_KEYS = new Set(['location', 'phone', 'email']);
  const LINK_KEYS = new Set(['portfolio', 'github', 'linkedin']);

  let section = 'contact';
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Section heading: "## Experience" etc.
    if (line.startsWith('## ')) {
      const name = line.slice(3).trim().toLowerCase();
      section = name.startsWith('experience') ? 'experience'
        : name.startsWith('project') ? 'projects'
        : name.startsWith('education') ? 'education'
        : name.startsWith('skill') ? 'skills'
        : 'unknown';
      current = null;
      continue;
    }

    // Name: "# Ben Vinnick"
    if (line.startsWith('# ')) {
      resume.name = line.slice(2).trim();
      continue;
    }

    // Entry heading: "### ..."
    if (line.startsWith('### ')) {
      const parts = line.slice(4).split('|').map((p) => p.trim());
      if (section === 'experience') {
        current = { company: parts[0], location: parts[1] || '', title: '', startDate: '', endDate: '', highlights: [] };
        resume.workExperience.push(current);
      } else if (section === 'projects') {
        // "Title | link | date"  or  "Title | date"
        const [title, second, third] = parts;
        const hasLink = parts.length >= 3;
        current = { title, link: hasLink ? second : '', date: hasLink ? third : second || '', highlights: [] };
        resume.projects.push(current);
      } else if (section === 'education') {
        current = { school: parts[0], location: parts[1] || '', degree: '', faculty: '', startDate: '', endDate: '', gpa: '', coursework: [] };
        resume.education = current;
      }
      continue;
    }

    // Title / degree line: "**Title** | Start – End"
    if (line.startsWith('**')) {
      const m = line.match(/^\*\*(.+?)\*\*\s*(?:\|\s*(.*))?$/);
      const title = (m ? m[1] : line.replace(/\*/g, '')).trim();
      const { startDate, endDate } = splitDateRange(m && m[2] ? m[2] : '');
      if (section === 'experience' && current) Object.assign(current, { title, startDate, endDate });
      else if (section === 'education' && current) Object.assign(current, { degree: title, startDate, endDate });
      continue;
    }

    // Bullet or key/value: "- ..."
    if (line.startsWith('- ')) {
      const content = line.slice(2).trim();
      const colon = content.indexOf(':');
      const key = colon !== -1 ? content.slice(0, colon).trim().toLowerCase() : '';
      const value = colon !== -1 ? content.slice(colon + 1).trim() : '';
      const csv = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

      if (section === 'contact' && colon !== -1) {
        if (CONTACT_KEYS.has(key)) resume[key] = value;
        else if (LINK_KEYS.has(key)) resume.links[key] = value;
      } else if (section === 'skills' && colon !== -1) {
        resume.skills[key] = csv(value);
      } else if (section === 'education' && current && colon !== -1) {
        if (key === 'gpa') current.gpa = value;
        else if (key === 'faculty') current.faculty = value;
        else if (key === 'coursework') current.coursework = csv(value);
      } else if ((section === 'experience' || section === 'projects') && current) {
        current.highlights.push(content);
      }
      continue;
    }
  }

  return resume;
}

// ── Emit resume.js ─────────────────────────────────────────────────────────
function toResumeJs(resume) {
  return (
    '// AUTO-GENERATED FROM resume.md — DO NOT EDIT BY HAND.\n' +
    '// Run `npm run resume` to regenerate this file (and public/resume.pdf).\n\n' +
    `export const resumeObj = ${JSON.stringify(resume, null, 2)};\n`
  );
}

// ── Emit resume.pdf ──────────────────────────────────────────────────────────
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const displayUrl = (u = '') => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

function buildHtml(r) {
  const dates = (a, b) => (b ? `${esc(a)} - ${esc(b)}` : esc(a));
  const normDash = (s = '') => esc(s.replace(/\s[–—-]\s/, ' - ')); // match the "-" used elsewhere
  const bullets = (items) => `<ul>${items.map((h) => `<li>${inline(h)}</li>`).join('')}</ul>`;

  const jobs = r.workExperience
    .map(
      (j) => `
      <div class="entry">
        <div class="row"><span class="left b">${esc(j.company)}</span><span class="right">${esc(j.location)}</span></div>
        <div class="row"><span class="left">${esc(j.title)}</span><span class="right">${dates(j.startDate, j.endDate)}</span></div>
        ${bullets(j.highlights)}
      </div>`
    )
    .join('');

  const projects = r.projects
    .map(
      (p) => `
      <div class="entry">
        <div class="row"><span class="left b">${esc(p.title)}${p.link ? ` | <a href="${esc(p.link)}">${esc(displayUrl(p.link))}</a>` : ''}</span><span class="right">${normDash(p.date)}</span></div>
        ${bullets(p.highlights)}
      </div>`
    )
    .join('');

  const e = r.education;
  const eduExtras = [
    e.gpa ? `<div class="edu-line">Cumulative average: ${esc(e.gpa)}</div>` : '',
    e.coursework && e.coursework.length ? `<div class="edu-line">Coursework: ${esc(e.coursework.join(', '))}</div>` : '',
  ].join('');

  const skills = Object.entries(r.skills)
    .map(([k, v]) => `<div class="skill-line"><span class="b cap">${esc(k)}:</span> ${esc(v.join(', '))}</div>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; font-size: 9.8pt; line-height: 1.29; margin: 0; }
    a { color: #1a4d8f; text-decoration: none; }
    strong { font-weight: 700; }
    .name { font-size: 16pt; font-weight: 700; margin: 0 0 2px; }
    .contact { color: #333; margin-top: 1px; }
    .contact a { color: #1a4d8f; }
    h2 { font-size: 9.8pt; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #222; padding-bottom: 2px; margin: 10px 0 5px; }
    .entry { margin-bottom: 6px; page-break-inside: avoid; }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
    .left { text-align: left; }
    .right { text-align: right; white-space: nowrap; color: #333; }
    .b { font-weight: 700; }
    .cap { text-transform: capitalize; }
    ul { margin: 3px 0 0; padding-left: 17px; }
    li { margin-bottom: 3px; }
    .edu-line, .skill-line { margin-top: 2px; }
  </style></head><body>
    <div class="name">${esc(r.name)}</div>
    <div class="contact">${[esc(r.location), esc(r.phone), esc(r.email)].filter(Boolean).join(' | ')}</div>
    <div class="contact">${Object.values(r.links).filter(Boolean).map((u) => `<a href="${esc(u)}">${esc(displayUrl(u))}</a>`).join(' | ')}</div>

    <h2>Work Experience</h2>
    ${jobs}

    <h2>Projects</h2>
    ${projects}

    <h2>Education</h2>
    <div class="entry">
      <div class="row"><span class="left b">${esc(e.school)}</span><span class="right">${esc(e.location)}</span></div>
      <div class="row"><span class="left">${esc(e.degree)}</span><span class="right">${dates(e.startDate, e.endDate)}</span></div>
      ${eduExtras}
    </div>

    <h2>Technical Skills</h2>
    ${skills}
  </body></html>`;
}

async function buildPdf(resume) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error("Playwright isn't installed. Run `npm install` then `npx playwright install chromium`, or use --js-only.");
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(buildHtml(resume), { waitUntil: 'networkidle' });
  await page.pdf({
    path: PDF_PATH,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.6in', right: '0.6in' },
  });
  await browser.close();
}

export { parseResume, toResumeJs, buildHtml, buildPdf };

// ── Main (only when run directly, not when imported) ──────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const jsOnly = process.argv.includes('--js-only');
  const resume = parseResume(readFileSync(MD_PATH, 'utf8'));

  writeFileSync(JS_PATH, toResumeJs(resume));
  console.log(`✓ wrote ${relative(ROOT, JS_PATH)}`);

  if (!jsOnly) {
    await buildPdf(resume);
    console.log(`✓ wrote ${relative(ROOT, PDF_PATH)}`);
  }
}
