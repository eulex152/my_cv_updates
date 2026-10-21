// Renders the website from window.CV (assets/js/content.js) and handles the ES/EN toggle.
(function () {
  const CV = window.CV;
  const STORAGE_KEY = 'cv-lang';
  const main = document.getElementById('cv');

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const verifyUrl = (id) => `https://coursera.org/verify/${id}`;

  function readLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'es' || saved === 'en') return saved;
    } catch (e) { /* storage unavailable */ }
    return 'es';
  }

  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
  }

  const icons = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>',
  };

  function renderContact(t) {
    const p = CV.person;
    const items = [
      `<li>${icons.pin}<span>${esc(t.ui.location)}</span></li>`,
      `<li>${icons.mail}<a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>`,
      `<li>${icons.github}<a href="${esc(p.github)}" rel="me noopener" target="_blank">github.com/eulex152</a></li>`,
    ];
    if (p.linkedin) {
      items.push(`<li>${icons.linkedin}<a href="${esc(p.linkedin)}" rel="me noopener" target="_blank">LinkedIn</a></li>`);
    }
    document.getElementById('contact').innerHTML = items.join('');
  }

  const section = (id, title, body) =>
    `<section class="section" id="${id}" aria-labelledby="${id}-h"><h2 id="${id}-h">${esc(title)}</h2>${body}</section>`;

  const period = (from, to) =>
    `<p class="period">${esc(from)}${to ? ` — ${esc(to)}` : ''}</p>`;

  function renderDownloads(t) {
    const buttons = CV.downloads.map((d) => `
      <a class="btn" href="${esc(d.file)}" download>
        ${icons.download}
        <span><span class="btn-label">${esc(d.label)}</span><span class="btn-note">${esc(d.note)}</span></span>
      </a>`).join('');
    return `<section class="downloads no-print" aria-labelledby="dl-h">
      <h2 id="dl-h" class="visually-hidden">${esc(t.ui.downloads)}</h2>
      <div class="btn-grid">${buttons}</div>
    </section>`;
  }

  function renderExperience(t) {
    return t.experience.map((e) => `
      <article class="entry">
        ${period(e.from, e.to)}
        <div>
          <h3>${esc(e.role)}</h3>
          <p class="org">${esc(e.place)}</p>
          ${e.text ? `<p>${esc(e.text)}</p>` : ''}
          ${e.bullets ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>
      </article>`).join('');
  }

  function renderEducation(t) {
    return t.education.map((e) => `
      <article class="entry">
        ${period(e.from, e.to)}
        <div>
          <h3>${esc(e.degree)}</h3>
          <p class="org">${esc(e.place)}</p>
        </div>
      </article>`).join('');
  }

  function renderCourses(t) {
    return CV.courseGroupOrder.map((g) => {
      const items = t.courses.filter((c) => c.group === g).map((c) => `
        <li class="course">
          <div class="course-head">
            <h4>${esc(c.name)}</h4>
            <span class="date">${esc(c.date)}</span>
          </div>
          <p class="org">${esc(c.org)}</p>
          <p>${esc(c.text)}</p>
          ${c.verify ? `<a class="verify" href="${verifyUrl(c.verify)}" target="_blank" rel="noopener">${icons.check}${esc(t.ui.verify)} · ${esc(c.verify)}</a>` : ''}
        </li>`).join('');
      return `<div class="course-group"><h3>${esc(t.courseGroups[g])}</h3><ul class="courses">${items}</ul></div>`;
    }).join('');
  }

  function renderSkills(t) {
    // Skill strings may contain <b> markup authored in content.js.
    const list = (arr) => `<ul class="skills">${arr.map((s) => `<li>${s}</li>`).join('')}</ul>`;
    return `<div class="skill-cols">
      <div><h3>${esc(t.ui.skillsSoftware)}</h3>${list(t.skills.software)}</div>
      <div><h3>${esc(t.ui.skillsSecurity)}</h3>${list(t.skills.security)}</div>
    </div>`;
  }

  function renderLanguages(t) {
    return t.languages.map((l) => `
      <article class="entry">
        ${period(l.date)}
        <div>
          <h3>${esc(l.name)}</h3>
          <p class="org">${esc(l.org)}</p>
          <p>${esc(l.text)}</p>
        </div>
      </article>`).join('');
  }

  function render(lang) {
    const t = CV[lang];
    document.documentElement.lang = t.htmlLang;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]').setAttribute('content', t.meta.description);
    document.getElementById('title').textContent = t.title;
    document.getElementById('footer').textContent = t.ui.footer;
    document.querySelector('.lang-toggle').setAttribute('aria-label', t.ui.toggleLabel);
    renderContact(t);

    main.innerHTML = [
      renderDownloads(t),
      section('perfil', t.sections.profile, `<p class="lead">${esc(t.profile)}</p>`),
      section('experiencia', t.sections.experience, renderExperience(t)),
      section('educacion', t.sections.education, renderEducation(t)),
      section('cursos', t.sections.courses, renderCourses(t)),
      section('habilidades', t.sections.skills, renderSkills(t)),
      section('idiomas', t.sections.languages, renderLanguages(t)),
    ].join('');

    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
  }

  document.querySelectorAll('.lang-toggle button').forEach((b) => {
    b.addEventListener('click', () => {
      saveLang(b.dataset.lang);
      render(b.dataset.lang);
    });
  });

  render(readLang());
})();
