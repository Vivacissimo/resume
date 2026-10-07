# resume.junu.dev

Personal resume site for Joon Woo Kim (DevOps / Cloud Engineer).

- `index.html` is the **resume**: short enough to skim, projects shown as Problem / Action / Result cards.
- Each card links to a **project detail page** (`projects/*.html`). Together, the detail pages are the **portfolio**.
- The top-right buttons download the **resume PDF** and **portfolio PDF**, built automatically by GitHub Actions.

## Resume structure

```text
01 INTRODUCE
02 EXPERIENCE & PROJECTS   KT Cloud BootCamp → Cocoavision
03 SKILLS
04 PERSONAL
EDUCATION                  one line above the footer
```

## Files

```text
.
├── index.html                  # resume
├── styles.css                  # resume styles (screen + print)
├── script.js                   # section indicator
├── assets/profile.JPG
├── projects/                   # portfolio detail pages
│   ├── cloud-native.html
│   ├── moongcheap.html
│   ├── cocoavision.html
│   └── personal-infra.html
├── project-detail.css          # detail page + portfolio cover styles
├── portfolio-cover.html        # portfolio PDF cover and contents
├── scripts/build-pdf.mjs       # PDF build (Playwright + pdf-lib)
├── pdf/                        # build output: resume.pdf, portfolio.pdf
├── .github/workflows/build-pdf.yml
└── package.json                # Node is used only for the PDF build
```

## Stack

- Static HTML / CSS / vanilla JS (no framework, no bundler)
- Pretendard from jsDelivr
- Playwright (Chromium) and pdf-lib for PDFs

## Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Build PDFs

```bash
npm ci
npx playwright install chromium
npm run pdf
```

- `pdf/resume.pdf`: `index.html` printed to A4 (target: two pages or fewer)
- `pdf/portfolio.pdf`: `portfolio-cover.html` → `cloud-native` → `moongcheap` → `cocoavision` → `personal-infra`, rendered one by one and merged

The script serves the repo with Node's `http` module, waits for `document.fonts.ready`, and prints with the `print` media styles.
Sections marked `data-portfolio="exclude"` (for example the Cocoavision Real-time R&D case) stay on the web page but are left out of the portfolio PDF.

## Automatic PDF build

`.github/workflows/build-pdf.yml` runs on every push to `main` (except changes to `pdf/**` only):

1. `npm ci` and install Playwright Chromium
2. `npm run pdf`
3. If `pdf/` changed, commit it as `chore: rebuild PDFs [skip ci]` and push

This only updates the files in the repo. It does not deploy the site.

Target domain: `resume.junu.dev`
