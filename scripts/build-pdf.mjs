// Builds pdf/resume.pdf and pdf/portfolio.pdf from the static pages.
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
const PORTFOLIO_PAGES = [
  'portfolio-cover.html',
  'projects/moongcheap.html',
  'projects/cloud-native.html',
  'projects/cocoavision.html',
  'projects/personal-infra.html',
];

// Sections marked data-portfolio="exclude" stay on the web page but are left out of the portfolio PDF.
const PORTFOLIO_PRINT_CSS = '[data-portfolio="exclude"] { display: none !important; }';

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
    const resumeBytes = await renderPdf(browser, baseUrl + RESUME_PAGE);
    const resume = await PDFDocument.load(resumeBytes, { updateMetadata: false });
    await writeFile(path.join(outDir, 'resume.pdf'), await finalize(resume, 'Joon Woo Kim — Resume'));
    console.log(`pdf/resume.pdf (${resume.getPageCount()} pages)`);

    const portfolio = await PDFDocument.create({ updateMetadata: false });
    for (const pagePath of PORTFOLIO_PAGES) {
      const bytes = await renderPdf(browser, baseUrl + pagePath, PORTFOLIO_PRINT_CSS);
      const part = await PDFDocument.load(bytes, { updateMetadata: false });
      const pages = await portfolio.copyPages(part, part.getPageIndices());
      pages.forEach((p) => portfolio.addPage(p));
      console.log(`  + ${pagePath} (${pages.length} pages)`);
    }
    await writeFile(path.join(outDir, 'portfolio.pdf'), await finalize(portfolio, 'Joon Woo Kim — Portfolio'));
    console.log(`pdf/portfolio.pdf (${portfolio.getPageCount()} pages)`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
