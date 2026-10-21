// Builds pdf/submission.pdf (resume + condensed project pages) from the static pages.
// Usage: npm run pdf

import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'pdf');

// Links inside the PDFs point to the live site, not the local build server.
const SITE_URL = 'https://resume.junu.dev/';

const RESUME_PAGE = 'index.html';

// Submission file: the resume followed by the condensed project pages.
// In the resume part, the experience blocks marked data-submission="exclude" give way to
// the plain career list marked data-submission="only", since the project pages follow.
const SUBMISSION_PAGE = 'apply/portfolio.html';
const SUBMISSION_RESUME_CSS = `
  [data-submission="exclude"] { display: none !important; }
  [data-submission="only"] { display: block !important; }
  .org + .org { break-before: auto !important; }
  .resume-section { padding: 18px 0 !important; }

  /* Spread the three sections over the whole page instead of leaving the bottom empty */
  .resume { display: flex !important; flex-direction: column; min-height: 270mm; }
  .resume > .resume-section { flex: 1 1 auto; align-content: start; }

  /* Same label | content columns as the other sections */
  .experience-section { grid-template-columns: 132px 1fr !important; gap: 18px !important; }
  .career-list li { grid-template-columns: 40mm 1fr !important; padding: 13px 0 !important; font-size: 10.8pt !important; }
  .career-list p { font-size: 9.6pt; }

  /* Larger intro and headings so the content itself fills the page */
  .section-heading h2 { font-size: 14pt !important; }
  .intro-copy .lead { font-size: 11pt !important; line-height: 1.65 !important; margin-bottom: 10px !important; }
  .intro-copy p { font-size: 9.8pt !important; line-height: 1.75 !important; }
  blockquote { margin-top: 12px !important; padding: 10px 14px !important; font-size: 10.4pt !important; }
  .career-period { white-space: nowrap; }
  .org-list { border-top: 0 !important; padding-top: 0 !important; }

  /* Skills as plain "category | tools" rows */
  .skill-list { display: block !important; border-top: 0 !important; }
  .skill-item { display: grid !important; grid-template-columns: 50mm 1fr !important; gap: 10px !important; padding: 8px 0 !important; border-bottom: 0 !important; }
  .skill-item h3 { font-size: 9.6pt !important; }
  .skill-item strong { font-size: 10.6pt !important; }
  .skill-item p { display: none !important; }

`;

// Fixed metadata keeps build timestamps out of the PDF. Chromium output itself is not
// byte-identical across runs, so CI still commits fresh PDFs after each source change.
const FIXED_DATE = new Date('2026-01-01T00:00:00Z');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const filePath = path.join(root, decodeURIComponent(pathname));

    if (!filePath.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }

    try {
      const body = await readFile(filePath);
      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function renderPdf(browser, url, extraCss) {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  await page.goto(url, { waitUntil: 'networkidle' });
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.evaluate(() => document.fonts.ready);

  const todos = await page.evaluate((siteUrl) => {
    for (const a of document.querySelectorAll('a[href]')) {
      if (a.origin === location.origin) {
        a.href = siteUrl + a.pathname.slice(1) + a.search + a.hash;
      }
    }
    return [...document.querySelectorAll('.todo')].map((el) => el.textContent.trim());
  }, SITE_URL);
  if (todos.length) {
    console.warn(`  ! ${new URL(url).pathname} still has ${todos.length} TODO(s): ${todos.join(', ')}`);
  }


  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.close();
  return pdf;
}

async function finalize(doc, title) {
  doc.setTitle(title);
  doc.setAuthor('Joon Woo Kim');
  doc.setCreator('resume.junu.dev');
  doc.setProducer('resume.junu.dev build-pdf');
  doc.setCreationDate(FIXED_DATE);
  doc.setModificationDate(FIXED_DATE);
  return doc.save();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();

  try {
    const submission = await PDFDocument.create({ updateMetadata: false });
    const submissionParts = [
      await renderPdf(browser, baseUrl + RESUME_PAGE, SUBMISSION_RESUME_CSS),
      await renderPdf(browser, baseUrl + SUBMISSION_PAGE),
    ];
    for (const bytes of submissionParts) {
      const part = await PDFDocument.load(bytes, { updateMetadata: false });
      (await submission.copyPages(part, part.getPageIndices())).forEach((p) => submission.addPage(p));
    }
    await writeFile(path.join(outDir, 'submission.pdf'), await finalize(submission, 'Joon Woo Kim — Resume & Portfolio'));
    console.log(`pdf/submission.pdf (${submission.getPageCount()} pages)`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
