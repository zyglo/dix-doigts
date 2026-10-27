/* ============================================================
   Version installable (« app ») : installation sur l'écran d'accueil,
   fonctionnement hors ligne, stockage durable. Sans effet dans l'artefact
   claude.ai ni dans le fichier ouvert en local.
   ============================================================ */
'use strict';

/** Cible de compilation, injectée par build.js : 'app', 'artifact' ou 'file'. */
const APP_TARGET = typeof BUILD_TARGET !== 'undefined' ? BUILD_TARGET : 'file';
const AppInstall = { prompt: null, installed: false };

const isStandalone = () => {
  try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; }
};
/** iPhone, iPad (qui se présente comme un Mac tactile) ou Mac avec Safari : l'installation passe par un menu. */
function appleKind() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ipad';
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|Firefox|OPR/.test(ua)) return 'mac-safari';
  return null;
}

function initApp() {
  if (APP_TARGET !== 'app') return;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    AppInstall.prompt = e;
    if (App.page === 'home') render();
  });
  window.addEventListener('appinstalled', () => {
    AppInstall.installed = true; AppInstall.prompt = null;
    if (App.page === 'home') render();
  });
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne indisponible : le site marche quand même */ });
  }
  // demande au navigateur de ne pas effacer la progression quand l'espace manque
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignoré */ }
}

/** Encart d'installation de l'accueil, une fois le clavier reconnu. */
function installCardHTML() {
  if (APP_TARGET !== 'app' || isStandalone() || AppInstall.installed || settings().installHidden || !settings().kbChecked) return '';
  const kind = appleKind();
  let how, btn = '';
  if (AppInstall.prompt) {
    how = 'Installe Dix Doigts comme une application : une icône sur ton écran, une fenêtre à part, et ça marche même sans internet.';
    btn = '<button class="btn primary" type="button" id="instGo">Installer l\'application</button>';
  } else if (kind === 'iphone' || kind === 'ipad') {
    how = `Pour l'avoir comme une application sur ton ${kind === 'ipad' ? 'iPad' : 'iPhone'} : dans Safari, touche le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l'écran d'accueil ». Elle marchera ensuite même sans internet.`;
  } else if (kind === 'mac-safari') {
    how = 'Pour l\'avoir comme une application sur ton Mac : dans Safari, menu Fichier, puis « Ajouter au Dock ». Elle marchera ensuite même sans internet.';
  } else {
    how = 'Pour l\'avoir comme une application, ouvre cette page dans Chrome ou Edge et choisis « Installer » dans le menu (ou l\'icône à droite de la barre d\'adresse). Elle marche aussi sans internet une fois ouverte.';
  }
  return `<section class="panel install-card" aria-labelledby="h-inst">
    <h2 id="h-inst">Installer l'application</h2>
    <p>${esc(how)}</p>
    <div class="cta">${btn}<button class="btn ghost" type="button" id="instHide">Ne plus afficher</button></div>
  </section>`;
}
function bindInstall(root) {
  const goBtn = $('#instGo', root), hide = $('#instHide', root);
  if (goBtn) goBtn.addEventListener('click', async () => {
    const p = AppInstall.prompt;
    if (!p) return;
    AppInstall.prompt = null;
    try {
      p.prompt();
      const r = await p.userChoice;
      if (r && r.outcome === 'accepted') AppInstall.installed = true;
    } catch (e) { /* ignoré */ }
    render();
  });
  if (hide) hide.addEventListener('click', () => { settings().installHidden = true; Store.save(); render(); });
}

/** Sur un écran tactile sans clavier : les exercices marchent, mais la méthode demande un vrai clavier. */
function touchNoteHTML() {
  if (!isTouchOnly()) return '';
  return '<div class="note touch-note">Ici, les exercices se font avec le clavier de l\'écran : touche le texte pour le faire apparaître. Mais la méthode des dix doigts demande un vrai clavier : sur une tablette, branche un clavier USB ou Bluetooth pour en profiter vraiment.</div>';
}
