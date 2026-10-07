#!/usr/bin/env node
/**
 * Local resume preview — view the PDF in a browser without opening files.
 *
 *   npm run resume:preview   →  http://localhost:4322
 *
 * Every page load rebuilds the PDF from resume.md (+ resume.private.md), so
 * edit, save, refresh. Routes:
 *   /         full PDF (with private bullets, if resume.private.md exists)
 *   /public   public PDF (no private bullets)
 *
 * Listens on localhost only; nothing is written to public/ or private/.
 */
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseResume, buildPdf, withPrivateBullets } from './build-resume.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 4322;
const OUT_DIR = mkdtempSync(join(tmpdir(), 'resume-preview-'));

async function render(full) {
  let resume = parseResume(readFileSync(join(ROOT, 'resume.md'), 'utf8'));
  const privatePath = join(ROOT, 'resume.private.md');
  if (full && existsSync(privatePath)) resume = withPrivateBullets(resume, readFileSync(privatePath, 'utf8'));
  const out = join(OUT_DIR, full ? 'full.pdf' : 'public.pdf');
  await buildPdf(resume, out);
  return readFileSync(out);
}

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path !== '/' && path !== '/public') {
    res.writeHead(404).end();
    return;
  }
  try {
    const pdf = await render(path === '/');
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="resume.pdf"', 'Cache-Control': 'no-store' });
    res.end(pdf);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(err.stack || err));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Resume preview: http://localhost:${PORT}  (public version: /public)`);
});
