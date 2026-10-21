# CV — Euler Lorenzo Romero Chagua

Personal CV website (ES / EN), published with GitHub Pages:
**https://eulex152.github.io/**

Plain HTML + CSS + vanilla JS. No build step for the website itself.

## Structure

```
index.html                 Website shell (SEO / Open Graph tags live here)
assets/js/content.js       ALL CV text, in Spanish (es) and English (en)  ← edit this
assets/js/main.js          Renders the website + ES/EN toggle (saved in localStorage)
assets/css/site.css        Website styles (responsive, light/dark, print)
assets/img/                Optimized photo (generated from source/photo.jpg)
assets/fonts/              Source Sans 3 (self-hosted, SIL OFL)
assets/CV_*.pdf            Downloadable PDFs (generated, see below)
template/                  Print template the PDFs are rendered from
scripts/build-pdfs.mjs     Renders the 4 PDFs with headless Chromium (Playwright)
scripts/optimize-photo.mjs Crops/compresses source/photo.jpg for the web
```

## Editing the content

1. Edit `assets/js/content.js`. Keep the `es` and `en` blocks in sync (same entries, same order).
   - Courses have a `group` (`cyber`, `compliance`, `other`) used to group them on the website.
     Coursera courses have a `verify` ID; the link `https://coursera.org/verify/<ID>` is built automatically.
   - To show LinkedIn, paste your profile URL in `person.linkedin` (the link is hidden while it's empty).
2. Preview locally: `python3 -m http.server 8000` and open http://localhost:8000
3. Regenerate the PDFs (next section), then commit and push. GitHub Pages updates in about a minute.

The phone number is **not** in `content.js` (that file is public on the website). It is set in
`scripts/build-pdfs.mjs` (`PHONE`) and only appears inside the PDFs. Set it to `''` to remove it.

## Custom PDF (Add / Remove)

Each entry under Experience and Training has an **Agregar / Quitar** (Add / Remove) switch on the website.
The choice is remembered in the browser (localStorage). If nothing is removed, the download buttons
serve the pre-built PDFs. If something is removed, they open `template/cv.html` with that selection
(`?hide=e1,c2&print=1`) and the browser's print dialog; choose "Save as PDF".
Custom PDFs do not include the phone number (it is only added by the build script).

## Regenerating the PDFs

Requires Node.js 18+.

```bash
npm install
npx playwright install chromium     # first time only
npm run build:pdfs                  # writes the 4 PDFs into assets/
```

| File | Language | Photo |
|---|---|---|
| `assets/CV_Euler_Romero_ES.pdf` | Español | yes |
| `assets/CV_Euler_Romero_ES_sin_foto.pdf` | Español | no |
| `assets/CV_Euler_Romero_EN.pdf` | English | yes |
| `assets/CV_Euler_Romero_EN_no_photo.pdf` | English | no |

To preview the PDF layout in a browser, serve the repo (see above) and open
`/template/cv.html?lang=en&photo=1`, then use Print preview.

To change the photo, replace `source/photo.jpg` and run `npm run build:photo`, then `npm run build:pdfs`.

### Linux without sudo

If `npx playwright install-deps` is not possible (no root), Chromium's missing libraries and a fallback
font can be unpacked without root into `~/.cache/cv-chromium-libs`; `build-pdfs.mjs` uses that folder
automatically when it exists:

```bash
L=~/.cache/cv-chromium-libs; mkdir -p $L/debs && cd $L/debs
apt-get download <missing packages listed by "npx playwright install chromium"> fonts-dejavu-core
for d in *.deb; do dpkg-deb -x "$d" $L/root; done
# repeat with any libraries still reported by:
#   LD_LIBRARY_PATH=$L/root/usr/lib/x86_64-linux-gnu ldd ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome | grep "not found"
cat > $L/fonts.conf <<EOF
<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>$L/root/usr/share/fonts</dir><cachedir>$L/fontcache</cachedir></fontconfig>
EOF
```

## Privacy

This repository is public. On purpose, it does **not** contain:
- the certificate annexes from the original PDF (they include the DNI number);
- the full street address (only "Lima, Perú").
