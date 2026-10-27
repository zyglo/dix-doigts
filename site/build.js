// Assemble le site.
// Sorties : dist/artifact.html (fragment, sans doctype, pour la publication sur claude.ai)
//           dist/index.html (document complet, à ouvrir en local)
//           dist/bundle.js (le JavaScript seul, pour les tests)
//           ../docs/ (application installable, publiée par GitHub Pages : page, manifeste,
//                     service worker, polices et leurs licences, icônes)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const src = path.join(__dirname, 'src');
const dist = path.join(__dirname, 'dist');
const assets = path.join(__dirname, 'app-assets');
fs.mkdirSync(dist, { recursive: true });

const jsFiles = fs.readdirSync(src).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
const js = jsFiles.map(f => '/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

// chaque sortie sait pour quoi elle est compilée (textes de sauvegarde, installation)
const jsFor = target => ("const BUILD_TARGET = '" + target + "';\n" + js).replace(/<\/script>/gi, '<\\/script>');
const body = target => tpl.replace('/*CSS*/', () => css).replace('/*JS*/', () => jsFor(target));

/* ---------- artefact claude.ai et fichier local ---------- */
fs.writeFileSync(path.join(dist, 'artifact.html'), body('artifact'));
const full = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="format-detection" content="telephone=no">\n</head>\n<body>\n' + body('file') + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(dist, 'index.html'), full);
fs.writeFileSync(path.join(dist, 'bundle.js'), js);

/* ---------- application installable ---------- */
const appDir = path.join(__dirname, '..', 'docs');
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(path.join(appDir, 'fonts'), { recursive: true });
fs.mkdirSync(path.join(appDir, 'icons'), { recursive: true });
const copied = [];
for (const f of fs.readdirSync(path.join(assets, 'fonts')).filter(f => /\.woff2$/.test(f) || f === 'fonts.css')) {
  fs.copyFileSync(path.join(assets, 'fonts', f), path.join(appDir, 'fonts', f)); copied.push('fonts/' + f);
}
// licences des polices (SIL OFL) : elles accompagnent les fichiers, sans être mises en cache
for (const f of fs.readdirSync(path.join(assets, 'fonts')).filter(f => /^OFL-.*\.txt$/.test(f))) {
  fs.copyFileSync(path.join(assets, 'fonts', f), path.join(appDir, 'fonts', f));
}
for (const f of fs.readdirSync(path.join(assets, 'icons'))) {
  fs.copyFileSync(path.join(assets, 'icons', f), path.join(appDir, 'icons', f)); copied.push('icons/' + f);
}

const shell = tpl.slice(tpl.indexOf('<div id="app">'), tpl.indexOf('<script>')).trim();
const DESC = 'Apprendre à taper au clavier avec les dix doigts, en français : leçons, exercices, tests de vitesse et jeu. Marche aussi sans internet.';
const appHtml = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dix Doigts</title>
<meta name="description" content="${DESC}">
<meta name="theme-color" content="#f1f3f9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e1513" media="(prefers-color-scheme: dark)">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Dix Doigts">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
${css}
</style>
</head>
<body>
${shell}
<script>
${jsFor('app')}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(appDir, 'index.html'), appHtml);

const manifest = {
  name: 'Dix Doigts : taper à dix doigts',
  short_name: 'Dix Doigts',
  description: DESC,
  lang: 'fr',
  dir: 'ltr',
  id: './',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#f1f3f9',
  theme_color: '#f1f3f9',
  categories: ['education', 'productivity'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icons/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
};
fs.writeFileSync(path.join(appDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');

// le service worker garde une copie de tout ; son numéro de version change dès qu'un fichier change
const files = ['index.html', 'manifest.webmanifest'].concat(copied);
const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(appDir, f)));
const version = hash.digest('hex').slice(0, 12);
const sw = `/* Service worker de Dix Doigts : garde l'application disponible hors ligne. */
const VERSION = 'dix-doigts-${version}';
const FILES = ${JSON.stringify(files.map(f => './' + f))};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('dix-doigts-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // la page : d'abord le réseau, pour avoir la dernière version ; sinon la copie gardée
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 4000);
        const res = await fetch(req.url, { signal: ctl.signal, cache: 'no-cache' });
        clearTimeout(timer);
        if (res.ok) { cache.put('./index.html', res.clone()); return res; }
      } catch (err) { /* hors ligne ou trop lent */ }
      return (await cache.match('./index.html')) || Response.error();
    })());
    return;
  }
  // polices, icônes, manifeste : la copie gardée d'abord
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
`;
fs.writeFileSync(path.join(appDir, 'sw.js'), sw);
fs.writeFileSync(path.join(appDir, '.nojekyll'), '');

console.log('OK', jsFiles.join(', '), '|', Math.round(full.length / 1024) + ' Ko');
console.log('app :', files.length + 1, 'fichiers, version', version, '|', Math.round(appHtml.length / 1024) + ' Ko pour la page');
