// Renders the printable CV from window.CV. `window.CV_PHONE` is injected by scripts/build-pdfs.mjs.
// Extra params used by the website's custom downloads:
//   hide=e0,c3   leave out experience #0 and course #3 (indexes into content.js)
//   print=1      open the browser's print dialog once ready (to "Save as PDF")
(function () {
  const params = new URLSearchParams(location.search);
  const lang = params.get('lang') === 'en' ? 'en' : 'es';
  const withPhoto = params.get('photo') !== '0';
  const hidden = new Set((params.get('hide') || '').split(',').filter(Boolean));
  const autoPrint = params.get('print') === '1';
  const CV = window.CV;
  const t = CV[lang];
  const p = CV.person;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const row = (left, body, cls = '') =>
    `<div class="row ${cls}"><div class="when">${left}</div><div class="what">${body}</div></div>`;
  const dates = (from, to) => `[${esc(from)}${to ? ` —<br>${esc(to)}]` : ']'}`;
  const section = (title, body) => `<section><h2>${esc(title)}</h2>${body}</section>`;

  const contact = [
    `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`,
    window.CV_PHONE ? esc(window.CV_PHONE) : '',
    `GitHub: <a href="${esc(p.github)}">${esc(p.github.replace('https://', ''))}</a>`,
    p.linkedin ? `LinkedIn: <a href="${esc(p.linkedin)}">${esc(p.linkedin.replace(/^https:\/\/(www\.)?/, ''))}</a>` : '',
    esc(t.ui.location),
  ].filter(Boolean);

  const header = `
    <header class="${withPhoto ? 'has-photo' : ''}">
      ${withPhoto ? `<img class="photo" src="../${esc(p.photo)}" alt="">` : ''}
      <div>
        <p class="cv-label">${esc(t.ui.cvLabel)}</p>
        <h1>${esc(p.name)}</h1>
        <p class="title">${esc(t.title)}</p>
        <p class="contact">${contact.join('<span class="sep">·</span>')}</p>
      </div>
    </header>`;

  const profile = `<p class="profile"><b>${esc(t.sections.profilePdf)}:</b> ${esc(t.profile)}</p>`;

  const education = t.education.map((e) => row(dates(e.from, e.to), `
    <p><b>${esc(t.ui.degree)}:</b> ${esc(e.degree)}</p>
    <p><b>${esc(t.ui.place)}:</b> ${esc(e.place)}</p>`)).join('');

  const experience = t.experience.filter((e, i) => !hidden.has(`e${i}`)).map((e) => row(dates(e.from, e.to), `
    <p><b>${esc(t.ui.position)}:</b> ${esc(e.role)}</p>
    <p><b>${esc(t.ui.place)}:</b> ${esc(e.place)}</p>
    ${e.text ? `<p class="desc">${esc(e.text)}</p>` : ''}
    ${e.bullets ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`)).join('');

  const courses = t.courses.filter((c, i) => !hidden.has(`c${i}`)).map((c) => row(`[${esc(c.date)}]`, `
    <p class="course-name">${esc(c.name)}</p>
    <p class="org">${esc(c.org)}</p>
    <p>${esc(c.text)}${c.verify ? ` <span class="verify">(${esc(t.ui.verifyId)}: <a href="https://coursera.org/verify/${esc(c.verify)}">${esc(c.verify)}</a>)</span>` : ''}</p>`, 'compact')).join('');

  // Skill strings may contain <b> markup authored in content.js.
  const skills = `
    <h3>${esc(t.ui.skillsSoftware)}</h3>
    <ul>${t.skills.software.map((s) => `<li>${s}</li>`).join('')}</ul>
    <h3>${esc(t.ui.skillsSecurity)}</h3>
    <ul>${t.skills.security.map((s) => `<li>${s}</li>`).join('')}</ul>`;

  const languages = t.languages.map((l) => row(`[${esc(l.date)}]`, `
    <p>${esc(l.name)}</p>
    <p class="org">${esc(l.org)}</p>
    <p>${esc(l.text)}</p>`, 'compact')).join('');

  document.documentElement.lang = t.htmlLang;
  // When printing from the website, the title becomes the suggested PDF file name.
  document.title = autoPrint ? `CV_Euler_Romero_${lang.toUpperCase()}` : `CV ${p.name} (${lang.toUpperCase()})`;
  document.getElementById('cv').innerHTML = [
    autoPrint ? `<p class="print-hint">${esc(t.ui.printHint)}</p>` : '',
    header,
    profile,
    section(t.sections.education, education),
    experience ? section(t.sections.experiencePdf, experience) : '',
    courses ? section(t.sections.coursesPdf, courses) : '',
    section(t.sections.skillsPdf, skills),
    section(t.sections.languagesPdf, languages),
  ].join('');

  // Signal to the build script that fonts and the photo are ready.
  Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode().catch(() => {}))])
    .then(() => {
      document.body.dataset.ready = '1';
      if (autoPrint) window.print();
    });
})();
