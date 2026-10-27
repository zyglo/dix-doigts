// Copie locale des polices (licence SIL OFL) pour que l'application marche hors ligne.
// Lit app-assets/fonts/google.css, garde les jeux « latin » et « latin-ext »,
// télécharge les fichiers .woff2 et écrit app-assets/fonts/fonts.css.
const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, '..', 'app-assets', 'fonts');
const css = fs.readFileSync(path.join(dir, 'google.css'), 'utf8');

const get = url => new Promise((resolve, reject) => {
  https.get(url, res => {
    if (res.statusCode !== 200) { reject(new Error(url + ' → ' + res.statusCode)); res.resume(); return; }
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks)));
  }).on('error', reject);
});

(async () => {
  const blocks = css.split('/* ').slice(1).map(b => '/* ' + b);
  const keep = blocks.filter(b => /^\/\* (latin|latin-ext) \*\//.test(b));
  let out = '/* Polices auto-hébergées (SIL Open Font License) : Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono. */\n';
  const done = new Map();
  for (const b of keep) {
    const subset = b.match(/^\/\* ([a-z-]+) \*\//)[1];
    const family = b.match(/font-family: '([^']+)'/)[1];
    const weight = b.match(/font-weight: ([0-9 ]+);/)[1].trim().replace(/\s+/g, '-');
    const url = b.match(/url\((https:[^)]+)\)/)[1];
    let name = done.get(url);
    if (!name) {
      name = family.toLowerCase().replace(/\s+/g, '-') + '-' + weight + '-' + subset + '.woff2';
      const buf = await get(url);
      fs.writeFileSync(path.join(dir, name), buf);
      done.set(url, name);
      console.log(name, Math.round(buf.length / 1024) + ' Ko');
    }
    out += b.replace(url, name).trim() + '\n';
  }
  fs.writeFileSync(path.join(dir, 'fonts.css'), out);
  console.log('fonts.css :', keep.length, 'règles,', done.size, 'fichiers');
})().catch(e => { console.error(e); process.exit(1); });
