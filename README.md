# resume.junu.dev

Personal resume site for Joon Woo Kim (DevOps / Cloud Engineer).

- `index.html` is the **resume**: short enough to skim, projects shown as Problem / Action / Result cards.
- Each card links to a **project detail page** (`projects/*.html`). Together, the detail pages are the **portfolio**.
- The top-right button downloads the **submission PDF** (resume + condensed project pages), built automatically by GitHub Actions.

## Resume structure

```text
01 INTRODUCE
02 EXPERIENCE              KT Cloud TECH UP → Cocoavision
03 SKILLS
04 PERSONAL
```

## Files

```text
.
├── index.html                  # resume
├── styles.css                  # resume styles (screen + print)
├── script.js                   # section indicator
├── assets/                     # profile photo, architecture diagrams
├── projects/                   # portfolio detail pages
│   ├── cloud-native.html
│   ├── moongcheap.html
│   ├── hotel-booking.html
│   ├── cocoavision.html
│   └── personal-infra.html
├── project-detail.css          # detail page styles
├── apply/portfolio.html        # condensed project pages for the submission PDF
├── scripts/build-pdf.mjs       # PDF build (Playwright + pdf-lib)
├── pdf/submission.pdf          # build output
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

## Build the PDF

```bash
npm ci
npx playwright install chromium
npm run pdf
```

`pdf/submission.pdf` is the one file for job applications:

1. `index.html` printed as a one-page resume. Elements marked `data-submission="exclude"` (experience cards, personal section) are hidden and those marked `data-submission="only"` (plain career list) are shown.
2. The condensed project pages in `apply/portfolio.html`: MoongCheap → Hotel Booking → Medical MSA → Cocoavision → junu.dev Home Infrastructure.

The script serves the repo with Node's `http` module, waits for `document.fonts.ready`, and prints with the `print` media styles.
Same-site links are rewritten to `https://resume.junu.dev/...` before printing, so links in the PDFs open the live site.
If a page still has `.todo` placeholders, the build prints a warning listing them.

## Automatic PDF build

`.github/workflows/build-pdf.yml` runs on every push to `main` (except changes to `pdf/**` only):

1. `npm ci` and install Playwright Chromium
2. `npm run pdf`
3. If `pdf/` changed, commit it as `chore: rebuild PDFs [skip ci]` and push

Cloudflare Workers Builds deploys the site on every push to `main` (`wrangler.jsonc`, with build-only files listed in `.assetsignore`).

Target domain: `resume.junu.dev`
