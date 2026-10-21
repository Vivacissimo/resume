import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const [pdfPath, out, name, from, to, scale] = process.argv.slice(2);
const b64 = readFileSync(pdfPath).toString('base64');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
await p.setContent(`<body style="margin:0;background:#888"><div id=w style="display:flex;flex-wrap:wrap;gap:8px;padding:8px"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
(async()=>{const d=Uint8Array.from(atob('${b64}'),c=>c.charCodeAt(0));const pdf=await pdfjsLib.getDocument({data:d}).promise;
for(let i=${from};i<=${to};i++){const pg=await pdf.getPage(i);const v=pg.getViewport({scale:${scale}});const c=document.createElement('canvas');c.width=v.width;c.height=v.height;document.getElementById('w').appendChild(c);await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise;}
document.body.dataset.done=1;})();</script></body>`);
await p.waitForSelector('body[data-done]', { timeout: 60000 });
await p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
await b.close();
