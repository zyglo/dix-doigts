/* ============================================================
   Routeur, en-tête, thème, démarrage
   ============================================================ */
'use strict';

const NAV = [
  ['home', 'Accueil'], ['guide', 'Guide'], ['cours', 'Parcours'], ['pratique', 'Entraînement'],
  ['test', 'Test'], ['jeu', 'Jeu'], ['stats', 'Statistiques'],
];

function applyTheme() {
  const t = settings().theme, r = document.documentElement;
  if (t === 'light' || t === 'dark') r.setAttribute('data-theme', t); else r.removeAttribute('data-theme');
}
function effectiveDark() {
  const t = settings().theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
}

function renderChrome() {
  $('#top').innerHTML = `
    <div class="top-in">
      <button class="brand" type="button" data-go="home" aria-label="Dix Doigts, accueil">
        <span class="logo" aria-hidden="true"><i class="f-lp"></i><i class="f-lr"></i><i class="f-lm"></i><i class="f-li"></i><i class="f-ri"></i><i class="f-rm"></i><i class="f-rr"></i><i class="f-rp"></i></span>
        <span class="brand-name">Dix Doigts</span>
      </button>
      <nav class="nav" aria-label="Navigation principale">
        ${NAV.map(n => `<button type="button" class="nav-i" data-go="${n[0]}" data-nav="${n[0]}">${n[1]}</button>`).join('')}
      </nav>
      <div class="top-actions">
        <button class="icon-btn" type="button" data-theme-toggle aria-label="Changer de thème" title="Changer de thème">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn" type="button" data-go="reglages" data-nav="reglages" aria-label="Réglages" title="Réglages">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>`;
  $('#foot').innerHTML = `<div class="foot-in"><span>Dix Doigts : apprendre à taper à dix doigts, en français.</span><span class="muted"><span class="sync ${Sync.state}" data-sync>${esc(SYNC_TEXT[Sync.state])}</span> · <button class="link" type="button" data-go="reglages">Sauvegarde</button></span></div>`;
}
function updateNav() {
  let cur = App.page;
  if (App.page === 'lecon') cur = 'cours';
  else if (App.page === 'run') cur = App.run ? (App.run.kind === 'lesson' ? 'cours' : (App.run.back || 'pratique')) : 'cours';
  $$('[data-nav]').forEach(b => {
    const on = b.dataset.nav === cur;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function render() {
  if (App.cleanup) { try { App.cleanup(); } catch (e) { /* ignoré */ } App.cleanup = null; }
  const P = PAGES[App.page] || PAGES.home;
  const main = $('#main');
  main.innerHTML = `<div class="wrap page page-${App.page}">${P.html(App.param)}</div>`;
  updateNav();
  if (P.mount) P.mount(main, App.param);
}

function go(page, param, fromHash) {
  if (!PAGES[page]) page = 'home';
  if (page !== App.page) App.kbNote = null;
  App.page = page; App.param = param || null;
  if (!fromHash) {
    try { const h = '#' + page + (param ? '-' + param : ''); if (location.hash !== h) location.hash = h; } catch (e) { /* iframe : ignoré */ }
  }
  render();
  window.scrollTo(0, 0);
  // la page reçoit le focus, sauf si elle l'a déjà donné (zone de frappe ouverte sur un écran tactile)
  const m = $('#main');
  if (m && !m.contains(document.activeElement)) { try { m.focus({ preventScroll: true }); } catch (e) { /* ignoré */ } }
}

function parseHash() {
  const m = /^#([a-z]+)(?:-(.+))?$/.exec(location.hash || '');
  if (!m || !PAGES[m[1]] || m[1] === 'run') return null;
  return { page: m[1], param: m[2] || null };
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-run],[data-scroll],[data-theme-toggle]');
  if (!t) return;
  if (t.hasAttribute('data-theme-toggle')) {
    settings().theme = effectiveDark() ? 'light' : 'dark'; Store.save(); applyTheme(); return;
  }
  if (t.dataset.scroll) {
    const el = document.getElementById(t.dataset.scroll);
    if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (t.dataset.run) {
    const [kind, lessonId, stage] = t.dataset.run.split(':');
    if (kind === 'lesson') startRun({ kind: 'lesson', lessonId, stage: +stage });
    return;
  }
  if (t.dataset.go != null) {
    const i = t.dataset.go.indexOf(':');
    const page = i < 0 ? t.dataset.go : t.dataset.go.slice(0, i);
    const param = i < 0 ? null : t.dataset.go.slice(i + 1);
    go(page, param);
  }
});

window.addEventListener('hashchange', () => {
  const h = parseHash();
  if (h && (h.page !== App.page || h.param !== App.param)) go(h.page, h.param, true);
});

function boot() {
  Store.load();
  applyTheme();
  renderChrome();
  const h = parseHash();
  go(h ? h.page : 'home', h ? h.param : null, true);
  Sync.init();
  initApp();
}
boot();
