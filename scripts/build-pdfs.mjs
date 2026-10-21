// Builds the downloadable PDFs from template/cv.html with headless Chromium (Playwright).
// Usage: npm run build:pdfs
//
// Output (in assets/):
//   CV_Euler_Romero_ES.pdf            CV_Euler_Romero_ES_sin_foto.pdf
//   CV_Euler_Romero_EN.pdf            CV_Euler_Romero_EN_no_photo.pdf
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The phone number appears only in the PDFs, never on the web page.
// Set it to '' to leave it out of the PDFs as well.
const PHONE = '(+51) 970-551-301';

const variants = [
  { lang: 'es', photo: true, out: 'assets/CV_Euler_Romero_ES.pdf' },
  { lang: 'es', photo: false, out: 'assets/CV_Euler_Romero_ES_sin_foto.pdf' },
  { lang: 'en', photo: true, out: 'assets/CV_Euler_Romero_EN.pdf' },
  { lang: 'en', photo: false, out: 'assets/CV_Euler_Romero_EN_no_photo.pdf' },
];

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

// Serve the repo over HTTP: Chromium blocks web fonts loaded from file:// URLs.
const server = createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// On machines without root access, Chromium's system libraries and a fallback font can be
// unpacked into ~/.cache/cv-chromium-libs (see README); use them when present.
const localDir = path.join(os.homedir(), '.cache/cv-chromium-libs');
const localLibs = path.join(localDir, 'root/usr/lib/x86_64-linux-gnu');
const env = existsSync(localLibs)
  ? {
      ...process.env,
      LD_LIBRARY_PATH: [localLibs, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':'),
      FONTCONFIG_FILE: path.join(localDir, 'fonts.conf'),
    }
  : process.env;

const browser = await chromium.launch({ env });
try {
  const page = await browser.newPage();
  await page.addInitScript((phone) => { window.CV_PHONE = phone; }, PHONE);
  for (const v of variants) {
    await page.goto(`${base}/template/cv.html?lang=${v.lang}&photo=${v.photo ? 1 : 0}`);
    await page.waitForSelector('body[data-ready="1"]');
    await page.pdf({
      path: path.join(root, v.out),
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    });
    console.log(`✓ ${v.out}`);
  }
} finally {
  await browser.close();
  server.close();
}
