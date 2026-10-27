/* ============================================================
   Pages : entraînement libre, test, jeu, statistiques, réglages
   ============================================================ */
'use strict';

/* ---------- Graphique en ligne (SVG, couleurs via classes) ---------- */
function lineChart(vals, o = {}) {
  const W = 640, H = 210, pl = 44, pr = 14, pt = 16, pb = 30;
  if (vals.length < 2) return '<p class="muted small">Il faut au moins deux séances pour tracer une courbe.</p>';
  const min = o.min != null ? o.min : 0;
  let max = o.max != null ? o.max : Math.max(10, ...vals);
  if (o.max == null) max = Math.ceil(max * 1.1 / 10) * 10;
  const x = i => pl + (W - pl - pr) * (i / (vals.length - 1));
  const y = v => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
  const ticks = 4;
  let g = '';
  for (let t = 0; t <= ticks; t++) {
    const v = min + (max - min) * t / ticks;
    g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${pl - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${Math.round(v)}</text>`;
  }
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${x(0).toFixed(1)},${y(min).toFixed(1)} ${pts} ${x(vals.length - 1).toFixed(1)},${y(min).toFixed(1)}`;
  const dots = vals.length <= 40 ? vals.map((v, i) => `<circle class="dt" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3"/>`).join('') : '';
  const lastV = vals[vals.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Courbe')}">
    ${g}
    <polygon class="ar" points="${area}"/>
    <polyline class="ln" points="${pts}"/>
    ${dots}
    <circle class="dt end" cx="${x(vals.length - 1).toFixed(1)}" cy="${y(lastV).toFixed(1)}" r="5"/>
    <text class="ax end-l" x="${x(vals.length - 1).toFixed(1)}" y="${(y(lastV) - 11).toFixed(1)}" text-anchor="end">${Math.round(lastV * 10) / 10}${o.unit || ''}</text>
    <text class="ax" x="${pl}" y="${H - 8}">séance 1</text>
    <text class="ax" x="${W - pr}" y="${H - 8}" text-anchor="end">séance ${vals.length}</text>
  </svg>`;
}

/* ============================================================
   ENTRAÎNEMENT LIBRE
   ============================================================ */
const PRACT_TYPES = [
  ['words', 'Mots', 'Des mots français courants'],
  ['sentences', 'Phrases', 'De vraies phrases, avec la ponctuation apprise'],
  ['text', 'Textes', 'Un paragraphe entier'],
  ['pseudo', 'Syllabes', 'Des combinaisons sans sens pour automatiser le geste'],
  ['pat', 'Touches choisies', 'Seulement les touches que tu as sélectionnées'],
  ['shortWords', 'Mots courts', 'De deux à cinq lettres'],
  ['longWords', 'Mots longs', 'Sept lettres et plus'],
  ['altWords', 'Alternance des mains', 'Gauche, droite, gauche…'],
  ['sameFingerWords', 'Même doigt', 'Le point dur : le même doigt deux fois de suite'],
  ['bigrams', 'Bigrammes', 'es, en, re, er, on, nt…'],
  ['digNums', 'Chiffres', 'Des nombres, avec les chiffres appris'],
  ['puncts', 'Ponctuation', '? ! : ; - dans de courtes phrases'],
  ['accWords', 'Accents', 'é è à ç ù ê â î ô û'],
  ['weak', 'Mes touches faibles', 'Des mots qui contiennent tes touches les plus ratées'],
];
const PR = { type: 'words', scope: 'all', lesson: 0, custom: '', len: 100, rhythm: false, cpm: 150 };
const LEN_OPTS = [[40, 'Court'], [100, 'Moyen'], [220, 'Long'], [400, 'Très long']];

function practiceCtx(id) {
  let c;
  if (PR.scope === 'all') c = ctxAll(id);
  else if (PR.scope === 'lesson') {
    const ls = lessonsFor(id);
    const idx = clamp(PR.lesson, 0, ls.length - 1);
    c = makeCtx(id, learnedAt(id, idx), keysOf(ls[idx], id));
  } else {
    const set = new Set([' ']);
    [...PR.custom].forEach(ch => set.add(ch));
    c = makeCtx(id, { set, caps: false }, PR.custom);
  }
  return c;
}
function practiceText(n) {
  const id = layoutId();
  let c = practiceCtx(id);
  if (PR.type === 'weak') {
    const w = weakKeys(id, 6, 5).map(r => r.k);
    if (!w.length) return null;
    c = ctxAll(id); c.newKeys = w; c.newPlain = w.filter(k => /[a-z]/.test(k));
  }
  if (PR.type === 'pat' && !c.newKeys.length) return null;
  if (PR.type === 'digNums' && !c.digits.length) return null;
  if (PR.type === 'accWords' && !isAz(id)) return null;
  const o = PR.type === 'digNums' ? { all: true } : {};
  const t = normalizeText((GEN[PR.type] || GEN.words)(c, n, o));
  return t || null;
}

PAGES.pratique = {
  html() {
    const id = layoutId();
    const ls = lessonsFor(id);
    const types = PRACT_TYPES.filter(t => !(t[0] === 'accWords' && !isAz(id))).map(t =>
      `<label class="opt"><input type="radio" name="ptype" value="${t[0]}"${PR.type === t[0] ? ' checked' : ''}><span><b>${esc(t[1])}</b><small>${esc(t[2])}</small></span></label>`).join('');
    const lessonOpts = ls.map((l, i) => `<option value="${i}"${PR.lesson === i ? ' selected' : ''}>${i + 1}. ${esc(lessonTitle(l, id))}</option>`).join('');
    const wk = weakKeys(id, 6, 5);
    return `
    <header class="page-head">
      <p class="kicker">Entraînement libre</p>
      <h1>Compose ton exercice</h1>
      <p class="lead">Choisis ce que tu veux travailler, avec quelles touches et sur quelle longueur. Chaque lancement génère un texte différent.</p>
    </header>
    <div class="practice-grid">
      <section class="panel">
        <h2>Que veux-tu travailler ?</h2>
        <div class="opts" id="ptypes">${types}</div>
        ${wk.length ? `<p class="small muted">Tes touches les plus ratées en ce moment : ${wk.map(r => keycapsHTML(r.k)).join(' ')}</p>` : '<p class="small muted">« Mes touches faibles » sera disponible après quelques exercices.</p>'}
      </section>
      <div class="stack">
        <section class="panel">
          <h2>Avec quelles touches ?</h2>
          <div class="opts compact">
            <label class="opt"><input type="radio" name="pscope" value="all"${PR.scope === 'all' ? ' checked' : ''}><span><b>Tout le clavier</b></span></label>
            <label class="opt"><input type="radio" name="pscope" value="lesson"${PR.scope === 'lesson' ? ' checked' : ''}><span><b>Jusqu'à une leçon</b></span></label>
            <label class="opt"><input type="radio" name="pscope" value="custom"${PR.scope === 'custom' ? ' checked' : ''}><span><b>Je choisis les touches</b></span></label>
          </div>
          <div id="scopeLesson" ${PR.scope === 'lesson' ? '' : 'hidden'}>
            <label class="field" for="plesson"><span>Leçon</span><select id="plesson">${lessonOpts}</select></label>
          </div>
          <div id="scopeCustom" ${PR.scope === 'custom' ? '' : 'hidden'}>
            <p class="small muted">Clique sur les touches du clavier. <button class="link" type="button" id="pclear">Tout effacer</button> · <button class="link" type="button" id="phome">Rangée de base</button></p>
            <div class="kb-wrap" id="kbPick">${kbHTML(id, { compact: true })}</div>
            <p class="small" id="pselected"></p>
          </div>
        </section>
        <section class="panel">
          <h2>Longueur et rythme</h2>
          <div class="chips" id="plen">${LEN_OPTS.map(o => `<label class="chip-radio"><input type="radio" name="plen" value="${o[0]}"${PR.len === o[0] ? ' checked' : ''}><span>${esc(o[1])}</span></label>`).join('')}</div>
          <label class="check"><input type="checkbox" id="prhythm"${PR.rhythm ? ' checked' : ''}><span>Métronome : un bip, une touche</span></label>
          <div id="rhythmBox" ${PR.rhythm ? '' : 'hidden'}>
            <label class="field" for="pcpm"><span>Cadence : <b id="pcpmV">${PR.cpm}</b> touches par minute (≈ ${Math.round(PR.cpm / 5)} mots / min)</span><input type="range" id="pcpm" min="60" max="330" step="10" value="${PR.cpm}"></label>
          </div>
        </section>
        <p class="note warn" id="pNote" hidden></p>
        <div class="cta"><button class="btn primary lg" type="button" id="pgo">Lancer l'exercice</button></div>
      </div>
    </div>`;
  },
  mount(root) {
    const id = layoutId();
    $$('input[name="ptype"]', root).forEach(i => i.addEventListener('change', () => { PR.type = i.value; }));
    $$('input[name="plen"]', root).forEach(i => i.addEventListener('change', () => { PR.len = +i.value; }));
    $$('input[name="pscope"]', root).forEach(i => i.addEventListener('change', () => {
      PR.scope = i.value;
      $('#scopeLesson', root).hidden = PR.scope !== 'lesson';
      $('#scopeCustom', root).hidden = PR.scope !== 'custom';
    }));
    $('#plesson', root).addEventListener('change', e => { PR.lesson = +e.target.value; });
    const rb = $('#prhythm', root);
    rb.addEventListener('change', () => { PR.rhythm = rb.checked; $('#rhythmBox', root).hidden = !rb.checked; });
    $('#pcpm', root).addEventListener('input', e => { PR.cpm = +e.target.value; $('#pcpmV', root).textContent = PR.cpm; });
    // sélecteur de touches
    const kb = Keyboard($('#kbPick .kb', root));
    const sync = () => {
      kb.setFocus(PR.custom);
      $('#pselected', root).innerHTML = PR.custom ? 'Touches choisies : ' + keycapsHTML(PR.custom) : '<span class="muted">Aucune touche choisie.</span>';
    };
    $('#kbPick', root).addEventListener('click', e => {
      const k = e.target.closest('.key[data-k]');
      if (!k || k.dataset.k.startsWith('__') || k.dataset.k === ' ') return;
      const ch = k.dataset.k;
      PR.custom = PR.custom.includes(ch) ? PR.custom.replace(ch, '') : PR.custom + ch;
      sync();
    });
    $('#pclear', root).addEventListener('click', () => { PR.custom = ''; sync(); });
    $('#phome', root).addEventListener('click', () => { PR.custom = LAYOUT_DEFS[id].home; sync(); });
    sync();
    $('#pgo', root).addEventListener('click', () => {
      const note = $('#pNote', root);
      note.hidden = true;
      if (PR.scope === 'custom' && PR.custom.length < 2) { note.textContent = 'Choisis au moins deux touches sur le clavier.'; note.hidden = false; return; }
      const t = practiceText(PR.len);
      if (!t) {
        note.textContent = PR.type === 'weak' ? 'Fais d\'abord quelques exercices : le site repère tes touches faibles au fil de tes séances.'
          : PR.type === 'pat' ? 'Choisis des touches ou une leçon : cet exercice travaille seulement les nouvelles touches.'
          : PR.type === 'digNums' ? 'Les chiffres ne sont pas inclus dans cette sélection. Choisis « Tout le clavier » ou une leçon plus avancée.'
          : 'Cette combinaison ne donne aucun texte. Essaie avec plus de touches.';
        note.hidden = false; return;
      }
      const label = PRACT_TYPES.find(t => t[0] === PR.type)[1];
      startRun({
        kind: 'practice', back: 'pratique', kicker: 'Entraînement libre', title: label, sub: PR.scope === 'all' ? 'Tout le clavier' : PR.scope === 'lesson' ? 'Jusqu\'à la leçon ' + (PR.lesson + 1) : 'Touches choisies',
        ref: PR.type, make: () => practiceText(PR.len) || t, rhythm: PR.rhythm ? PR.cpm : null,
        focusKeys: PR.scope === 'custom' ? PR.custom : '',
      });
    });
  },
};

/* ============================================================
   TEST DE VITESSE
   ============================================================ */
const TEST = { dur: 60, kind: 'sentences' };
PAGES.test = {
  html() {
    const d = Store.d;
    const tests = d.history.filter(h => h.mode === 'test');
    const cr = currentRank();
    const rows = tests.slice(-8).reverse().map(h => `<tr><td>${new Date(h.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td><td>${fmtDur(h.secs)}</td><td><b>${h.wpm}</b> mpm</td><td>${h.acc} %</td><td>${medalHTML(rankFor(h.wpm, h.acc), 'sm')} ${esc(rankFor(h.wpm, h.acc).name)}</td></tr>`).join('');
    return `
    <header class="page-head">
      <p class="kicker">Test de vitesse</p>
      <h1>Où en es-tu ?</h1>
      <p class="lead">Tape le texte affiché le plus vite possible en restant précis. Le premier test sert de point de départ : refais-le chaque semaine pour mesurer ta progression.</p>
    </header>
    <div class="grid g2">
      <section class="panel">
        <h2>Durée</h2>
        <div class="chips">${[[30, '30 secondes'], [60, '1 minute'], [120, '2 minutes'], [180, '3 minutes']].map(o => `<label class="chip-radio"><input type="radio" name="tdur" value="${o[0]}"${TEST.dur === o[0] ? ' checked' : ''}><span>${o[1]}</span></label>`).join('')}</div>
        <h2>Texte</h2>
        <div class="chips">${[['sentences', 'Phrases'], ['text', 'Paragraphes'], ['words', 'Mots courants']].map(o => `<label class="chip-radio"><input type="radio" name="tkind" value="${o[0]}"${TEST.kind === o[0] ? ' checked' : ''}><span>${o[1]}</span></label>`).join('')}</div>
        <p class="small muted">Le test inclut majuscules, accents et ponctuation. Il se termine à la fin du temps imparti.</p>
        <div class="cta"><button class="btn primary lg" type="button" id="tgo">Lancer le test</button></div>
      </section>
      <section class="panel">
        <h2>Ton rang</h2>
        ${cr ? `<div class="lv-head sm">${medalHTML(cr.r)}<div><h3>${esc(cr.r.name)}</h3><p class="muted small">${cr.t.wpm} mpm · ${cr.t.acc} % de précision</p></div></div>
          <p>${esc(nextRankHint(cr.t.wpm, cr.t.acc, cr.idx))}</p>`
          : '<p class="muted">Pas encore de rang. Ton premier test sert aussi de point de départ.</p>'}
        <p class="small muted">${RANKS.slice(1).map(k => esc(k.name) + ' dès ' + k.min).join(' · ')} mots par minute, avec une précision minimale pour chaque rang. Un mot compte pour cinq caractères.</p>
        <div class="cta"><button class="btn" type="button" data-go="stats">Voir la jauge et le tableau des rangs</button></div>
      </section>
    </div>
    <section class="band">
      <h2>Tes derniers tests</h2>
      ${tests.length >= 1 ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Durée</th><th>Vitesse</th><th>Précision</th><th>Rang</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Aucun test pour le moment. Lance le premier pour connaître ton point de départ.</p>'}
      ${tests.length >= 2 ? `<h3>Évolution</h3>${lineChart(tests.slice(-30).map(h => h.wpm), { label: 'Vitesse aux tests', unit: ' mpm' })}` : ''}
    </section>`;
  },
  mount(root) {
    $$('input[name="tdur"]', root).forEach(i => i.addEventListener('change', () => { TEST.dur = +i.value; }));
    $$('input[name="tkind"]', root).forEach(i => i.addEventListener('change', () => { TEST.kind = i.value; }));
    $('#tgo', root).addEventListener('click', () => {
      const id = layoutId();
      const c = ctxAll(id);
      const kind = TEST.kind;
      const gen = () => normalizeText(kind === 'text' ? GEN.text(c, 300) : kind === 'words' ? GEN.shortWords(c, 220, { max: 7 }) : GEN.sentences(c, 260));
      startRun({
        kind: 'test', back: 'test', kicker: 'Test de vitesse', title: fmtDur(TEST.dur), sub: 'Tape jusqu\'à la fin du temps',
        ref: kind, timeLimit: TEST.dur, make: gen, more: gen,
      });
    });
  },
};

/* ============================================================
   JEU : PLUIE DE MOTS
   ============================================================ */
const GAME = { scope: -1, speed: 'normal' };
const SPEEDS = { calme: 0.75, normal: 1, rapide: 1.35 };

PAGES.jeu = {
  html() {
    const id = layoutId();
    const ls = lessonsFor(id);
    const opts = ['<option value="-1">Toutes les touches</option>'].concat(ls.map((l, i) => `<option value="${i}"${GAME.scope === i ? ' selected' : ''}>Jusqu'à la leçon ${i + 1}</option>`)).join('');
    return `
    <header class="page-head">
      <p class="kicker">Jeu</p>
      <h1>Pluie de mots</h1>
      <p class="lead">Des mots tombent du haut de l'écran. Tape-les avant qu'ils touchent le sol. Cinq vies, une difficulté qui monte. Utile pour gagner en réflexe sans penser à la méthode.</p>
    </header>
    <div id="gameRoot">
      <div class="panel game-setup">
        <label class="field" for="gscope"><span>Touches utilisées</span><select id="gscope">${opts}</select></label>
        <div class="field"><span>Vitesse</span>
          <div class="chips">${Object.keys(SPEEDS).map(k => `<label class="chip-radio"><input type="radio" name="gspeed" value="${k}"${GAME.speed === k ? ' checked' : ''}><span>${k[0].toUpperCase() + k.slice(1)}</span></label>`).join('')}</div>
        </div>
        <div class="cta"><button class="btn primary lg" type="button" id="ggo">Jouer</button></div>
        ${Store.d.best.game ? `<p class="small muted">Meilleur score : ${Store.d.best.game}</p>` : ''}
      </div>
    </div>`;
  },
  mount(root) {
    $('#gscope', root).addEventListener('change', e => { GAME.scope = +e.target.value; });
    $$('input[name="gspeed"]', root).forEach(i => i.addEventListener('change', () => { GAME.speed = i.value; }));
    $('#ggo', root).addEventListener('click', () => startGame($('#gameRoot', root)));
  },
};

function startGame(host) {
  const id = layoutId();
  const ls = lessonsFor(id);
  const learned = GAME.scope < 0 ? ctxAll(id).learned : learnedAt(id, clamp(GAME.scope, 0, ls.length - 1));
  const c = makeCtx(id, learned, []);
  let pool = wordPool(c, { min: 2, max: 10 }).filter(w => /^[a-zàâçéèêîôùû]+$/.test(w));
  if (pool.length < 14) { const extra = []; for (let i = 0; i < 30; i++) extra.push(pseudoWord(c, [], 3, 6)); pool = pool.concat(extra); }
  const mul = SPEEDS[GAME.speed] || 1;

  host.innerHTML = `
    <div class="game">
      <div class="hud game-hud">
        <div class="hud-i"><span class="v" data-g="score">0</span><span class="l">score</span></div>
        <div class="hud-i"><span class="v" data-g="lives">●●●●●</span><span class="l">vies</span></div>
        <div class="hud-i"><span class="v" data-g="level">1</span><span class="l">niveau</span></div>
        <div class="hud-i"><span class="v" data-g="combo">0</span><span class="l">série</span></div>
        <button class="btn ghost sm" type="button" data-g="quit">Quitter <kbd>Échap</kbd></button>
      </div>
      <div class="arena" data-g="arena"><div class="floor"></div></div>
      <div class="typed" data-g="buf" aria-live="off">Tape les mots qui tombent.</div>
    </div>`;
  const g = k => $(`[data-g="${k}"]`, host);
  const arena = g('arena');
  let words = [], target = null, buf = '', lives = 5, score = 0, level = 1, killed = 0, combo = 0, good = 0, bad = 0, charsOk = 0;
  let last = performance.now(), spawnIn = 600, raf = 0, over = false;
  const t0 = performance.now();

  function hudUpdate() {
    g('score').textContent = score;
    g('lives').textContent = '●'.repeat(Math.max(0, lives)) + '○'.repeat(Math.max(0, 5 - lives));
    g('level').textContent = level;
    g('combo').textContent = combo;
    g('buf').textContent = buf || (isTouchOnly() ? 'Tape les mots qui tombent. Touche la zone de jeu si le clavier disparaît.' : 'Tape les mots qui tombent.');
  }
  function spawn() {
    const maxLen = Math.min(10, 3 + Math.floor(level / 2) + 1);
    const cands = pool.filter(w => w.length <= maxLen);
    const text = pick(cands.length ? cands : pool);
    const el = document.createElement('span');
    el.className = 'fw';
    el.innerHTML = `<i></i><b>${esc(text)}</b>`;
    arena.appendChild(el);
    const W = arena.clientWidth, w = el.offsetWidth;
    let x = 6 + rnd(Math.max(1, W - w - 12)), tries = 0;
    while (tries++ < 6 && words.some(o => o.y < 70 && Math.abs(o.x - x) < Math.max(o.w, w) + 8)) x = 6 + rnd(Math.max(1, W - w - 12));
    words.push({ text, el, x, y: -34, w, v: (30 + level * 6) * mul + rnd(8) });
  }
  function drop(w, cls) {
    words = words.filter(o => o !== w);
    w.el.classList.add(cls);
    setTimeout(() => w.el.remove(), 260);
    if (target === w) { target = null; buf = ''; }
  }
  function frame(now) {
    if (over) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const H = arena.clientHeight;
    spawnIn -= dt * 1000;
    if (spawnIn <= 0) { spawn(); spawnIn = Math.max(750, (2500 - level * 170) / mul); }
    for (const w of words.slice()) {
      w.y += w.v * dt;
      w.el.style.transform = `translate(${w.x}px, ${w.y}px)`;
      if (w.y > H - 36) { lives--; combo = 0; drop(w, 'lost'); hudUpdate(); if (lives <= 0) { end(); return; } }
    }
    raf = requestAnimationFrame(frame);
  }
  function paintTarget() {
    words.forEach(w => {
      const done = w === target ? buf.length : 0;
      w.el.classList.toggle('target', w === target);
      const i = w.el.firstChild; i.textContent = w.text.slice(0, done);
      w.el.lastChild.textContent = w.text.slice(done);
    });
  }
  let lastKey = null;
  function onKey(e) {
    if (over) return;
    if (e.key === 'Escape') { e.preventDefault(); quit(); return; }
    if ((e.ctrlKey || e.metaKey) && !(e.getModifierState && e.getModifierState('AltGraph'))) return;
    if (e.key.length !== 1) { if (e.key === 'Dead') e.preventDefault(); return; }
    e.preventDefault();
    lastKey = { ch: e.key, t: performance.now() };
    typeChar(e.key);
  }
  function typeChar(key) {
    const ch = key.toLowerCase();
    if (ch === ' ') return;
    let ok = false;
    if (target && target.text[buf.length] === ch) { buf += ch; ok = true; }
    else {
      const c2 = words.filter(w => w.text[0] === ch).sort((a, b) => b.y - a.y)[0];
      if (c2) { target = c2; buf = ch; ok = true; }
    }
    if (ok) {
      good++; charsOk++; Sound.ok();
      if (target && buf === target.text) {
        score += target.text.length * 10 * (1 + Math.floor(combo / 5));
        combo++; killed++;
        drop(target, 'hit');
        if (killed % 8 === 0) level++;
      }
    } else {
      bad++; combo = 0; Sound.err();
      arena.classList.remove('shake'); void arena.offsetWidth; arena.classList.add('shake');
    }
    paintTarget(); hudUpdate();
  }
  function cleanup() { over = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); soft.blur(); }
  function quit() { cleanup(); go('jeu'); }
  function end() {
    cleanup();
    const secs = (performance.now() - t0) / 1000;
    const acc = good + bad ? Math.round(1000 * good / (good + bad)) / 10 : 100;
    const wpm = Math.round((charsOk / 5) / (secs / 60));
    const best = Store.d.best.game || 0;
    const record = score > best;
    if (record) Store.d.best.game = score;
    logSession({ t: Date.now(), mode: 'game', ref: GAME.speed, wpm, acc, secs, chars: charsOk, errs: bad });
    Sound.done();
    host.innerHTML = `
      <div class="result">
        <div class="result-head"><p class="kicker">Pluie de mots</p><h2>${record ? 'Nouveau record !' : 'Partie terminée'}</h2></div>
        <div class="grid g4 big-stats">
          <div class="panel"><span class="bs-v">${score}</span><span class="bs-l">score</span>${best && !record ? `<span class="small muted">record : ${best}</span>` : ''}</div>
          <div class="panel"><span class="bs-v">${killed}</span><span class="bs-l">mots tapés</span></div>
          <div class="panel"><span class="bs-v">${level}</span><span class="bs-l">niveau atteint</span></div>
          <div class="panel"><span class="bs-v">${acc % 1 === 0 ? acc : acc.toFixed(1)}<small>%</small></span><span class="bs-l">précision</span></div>
        </div>
        <div class="cta result-actions"><button class="btn primary lg" type="button" id="gAgain">Rejouer <kbd>Entrée</kbd></button> <button class="btn ghost" type="button" id="gBack">Changer de réglage</button></div>
      </div>`;
    $('#gAgain', host).addEventListener('click', () => startGame(host));
    $('#gBack', host).addEventListener('click', () => go('jeu'));
    // Entrée ou Tab : rejouer sans la souris
    const tEnd = performance.now();
    const hk = e => {
      if ((e.key !== 'Enter' && e.key !== 'Tab') || e.repeat || performance.now() - tEnd < 700) return;
      e.preventDefault();
      window.removeEventListener('keydown', hk, true);
      startGame(host);
    };
    window.addEventListener('keydown', hk, true);
    App.cleanup = () => window.removeEventListener('keydown', hk, true);
  }
  $('[data-g="quit"]', host).addEventListener('click', quit);
  // clavier de l'écran (téléphone, tablette sans clavier)
  const soft = softInput(arena, ch => {
    if (over) return;
    if (lastKey && lastKey.ch === ch && performance.now() - lastKey.t < 150) { lastKey = null; return; }
    typeChar(ch);
  });
  arena.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') soft.focus(); });
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (isTouchOnly()) soft.focus();
  window.addEventListener('keydown', onKey, true);
  App.cleanup = cleanup;
  hudUpdate();
  raf = requestAnimationFrame(t => { last = t; frame(t); });
}

/* ============================================================
   STATISTIQUES
   ============================================================ */
const STAT = { heat: 'err' };
PAGES.stats = {
  html() {
    const id = layoutId();
    const d = Store.d;
    const hist = d.history.filter(h => h.secs >= 4);
    const totalSecs = Object.values(d.days).reduce((a, b) => a + b, 0);
    const last10 = hist.slice(-10);
    const avgAcc = last10.length ? Math.round(10 * last10.reduce((a, h) => a + h.acc, 0) / last10.length) / 10 : null;
    const wk = weakKeys(id, 6, 5);
    // activité sur 14 jours
    const days = [];
    const dd = new Date();
    for (let i = 13; i >= 0; i--) {
      const x = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate() - i);
      const k = x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
      days.push({ k, s: d.days[k] || 0, lab: x.toLocaleDateString('fr-FR', { weekday: 'narrow' }) });
    }
    const maxS = Math.max(60, ...days.map(x => x.s));
    // par doigt
    const km = statsOf(id);
    const L = LAYOUTS[id];
    const perF = {};
    FINGER_ORDER.concat(['th']).forEach(f => perF[f] = { h: 0, m: 0, t: 0, n: 0 });
    Object.entries(km).forEach(([k, r]) => { const i = L.map.get(k); if (!i) return; const p = perF[i.f]; p.h += r.h; p.m += r.m; p.t += r.t; p.n += r.n; });
    const fingerRows = FINGER_ORDER.concat(['th']).map(f => {
      const p = perF[f]; const seen = p.h + p.m;
      const acc = seen ? Math.round(1000 * p.h / seen) / 10 : null;
      const ms = p.n ? Math.round(p.t / p.n) : null;
      return `<tr><td><span class="sw-inline f-${f}"></span>${esc(FINGERS[f].n)}</td><td>${seen || '–'}</td><td>${acc != null ? acc + ' %' : '–'}</td><td>${ms != null ? ms + ' ms' : '–'}</td></tr>`;
    }).join('');
    const lessonsDone = courseProgress(id);
    const recent = hist.slice(-10).reverse().map(h => {
      const lab = h.mode === 'lesson' ? 'Leçon' : h.mode === 'test' ? 'Test' : h.mode === 'game' ? 'Jeu' : 'Libre';
      return `<tr><td>${new Date(h.t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>${lab}</td><td>${h.wpm} mpm</td><td>${h.acc} %</td><td>${fmtDur(h.secs)}</td></tr>`;
    }).join('');
    return `
    <header class="page-head">
      <p class="kicker">Statistiques</p>
      <h1>Tes progrès</h1>
      <p class="lead">Tout est calculé à partir de tes séances et enregistré automatiquement.</p>
    </header>
    <section class="band" id="niveau">
      <h2>Ton niveau</h2>
      ${levelPanelHTML()}
    </section>
    <div class="grid g4 stat-tiles">
      <div class="panel"><span class="bs-v">${hist.length}</span><span class="bs-l">séances</span></div>
      <div class="panel"><span class="bs-v">${fmtDur(totalSecs)}</span><span class="bs-l">temps d'entraînement</span></div>
      <div class="panel"><span class="bs-v">${d.best.test || '–'}</span><span class="bs-l">record au test (mpm)</span></div>
      <div class="panel"><span class="bs-v">${avgAcc != null ? avgAcc + '<small>%</small>' : '–'}</span><span class="bs-l">précision récente</span></div>
    </div>
    <section class="band">
      <h2>Vitesse et précision</h2>
      <div class="grid g2">
        <div class="panel"><h3>Mots par minute</h3>${lineChart(hist.slice(-40).map(h => h.wpm), { label: 'Vitesse par séance', unit: ' mpm' })}</div>
        <div class="panel"><h3>Précision</h3>${lineChart(hist.slice(-40).map(h => h.acc), { label: 'Précision par séance', unit: ' %', min: 50, max: 100 })}</div>
      </div>
    </section>
    <section class="band">
      <h2>Ton clavier</h2>
      <div class="panel">
        <div class="seg" role="group" aria-label="Type de carte">
          <button type="button" class="${STAT.heat === 'err' ? 'on' : ''}" data-heat="err">Erreurs</button>
          <button type="button" class="${STAT.heat === 'slow' ? 'on' : ''}" data-heat="slow">Lenteur</button>
        </div>
        <div class="kb-wrap" id="kbHeat">${kbHTML(id)}</div>
        <p class="small muted" id="heatLegend"></p>
      </div>
      <div class="grid g2">
        <div class="panel">
          <h3>Touches à travailler</h3>
          ${wk.length ? `<div class="weak-list">${wk.map(r => `<div class="weak">${keycapsHTML(r.k)}<span>${Math.round(100 * r.err)} % d'erreurs</span><span class="muted">${r.ms ? Math.round(r.ms) + ' ms' : ''}</span></div>`).join('')}</div>
          <div class="cta"><button class="btn primary" type="button" id="goWeak">Exercice sur ces touches</button></div>` : '<p class="muted">Pas assez de données. Fais quelques exercices et tes touches faibles apparaîtront ici.</p>'}
        </div>
        <div class="panel">
          <h3>Doigt par doigt</h3>
          <div class="tbl-wrap"><table class="tbl dense"><thead><tr><th>Doigt</th><th>Frappes</th><th>Précision</th><th>Temps moyen</th></tr></thead><tbody>${fingerRows}</tbody></table></div>
        </div>
      </div>
    </section>
    <section class="band">
      <h2>Régularité</h2>
      <div class="panel">
        <div class="days" role="img" aria-label="Minutes par jour sur les 14 derniers jours">
          ${days.map(x => `<div class="day"><div class="bar"><i style="height:${Math.round(100 * x.s / maxS)}%"></i></div><span>${esc(x.lab)}</span><b>${x.s ? Math.max(1, Math.round(x.s / 60)) : ''}</b></div>`).join('')}
        </div>
        <p class="small muted">Minutes par jour sur les 14 derniers jours. Série en cours : ${streakDays()} jour${streakDays() > 1 ? 's' : ''}. Leçons terminées : ${lessonsDone.done} sur ${lessonsDone.total}.</p>
      </div>
    </section>
    ${recent ? `<section class="band"><h2>Dernières séances</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quand</th><th>Type</th><th>Vitesse</th><th>Précision</th><th>Durée</th></tr></thead><tbody>${recent}</tbody></table></div></section>` : ''}`;
  },
  mount(root) {
    const id = layoutId();
    const kb = Keyboard($('#kbHeat .kb', root));
    const km = statsOf(id);
    const paint = () => {
      const vals = {};
      let n = 0;
      Object.entries(km).forEach(([k, r]) => {
        const seen = r.h + r.m;
        if (STAT.heat === 'err') {
          if (seen >= 4) { vals[k] = Math.min(1, (r.m / seen) / 0.2); n++; }
        } else if (r.n >= 4) { vals[k] = clamp((r.t / r.n - 180) / 520, 0, 1); n++; }
      });
      kb.heat(vals);
      $('#heatLegend', root).textContent = n
        ? (STAT.heat === 'err' ? 'Plus la touche est foncée, plus tu la rates souvent (à partir de 20 % d\'erreurs, elle est au maximum).' : 'Plus la touche est foncée, plus ton doigt met du temps à l\'atteindre.')
        : 'Pas encore assez de données : fais quelques exercices.';
      $$('[data-heat]', root).forEach(b => b.classList.toggle('on', b.dataset.heat === STAT.heat));
    };
    $$('[data-heat]', root).forEach(b => b.addEventListener('click', () => { STAT.heat = b.dataset.heat; paint(); }));
    paint();
    const gw = $('#goWeak', root);
    if (gw) gw.addEventListener('click', () => {
      PR.type = 'weak'; PR.scope = 'all'; PR.len = 100;
      const t = practiceText(100);
      if (!t) { go('pratique'); return; }
      startRun({ kind: 'practice', back: 'stats', kicker: 'Entraînement ciblé', title: 'Mes touches faibles', sub: 'Mots avec tes touches les plus ratées', ref: 'weak', make: () => practiceText(100) || t });
    });
  },
};

/* ============================================================
   RÉGLAGES
   ============================================================ */
PAGES.reglages = {
  html() {
    const s = settings();
    const sel = (name, v) => s[name] === v ? ' checked' : '';
    return `
    <header class="page-head">
      <p class="kicker">Réglages</p>
      <h1>Ajuster le site</h1>
    </header>
    ${kbNoteHTML()}
    <div class="grid g2">
      <section class="panel stack">
        <h2>Clavier</h2>
        <div class="opts compact">
          ${Object.values(LAYOUT_DEFS).map(l => `<label class="opt"><input type="radio" name="layout" value="${l.id}"${layoutId() === l.id ? ' checked' : ''}><span><b>${esc(l.name)}</b><small>${esc(l.hint)}</small></span></label>`).join('')}
        </div>
        <p class="small muted">Choisis la disposition de ton clavier physique. Les accents sont retirés des exercices en QWERTY.</p>
        <div class="kb-detect"><p class="small"><b>Reconnaître mon clavier.</b> Appuie sur la touche 8 de la rangée du haut, sans Maj : le site règle la disposition tout seul.</p><p class="small muted" data-kbc-status role="status"></p></div>
        <h2>Pendant la frappe</h2>
        <label class="check"><input type="checkbox" data-set="stopOnError"${s.stopOnError ? ' checked' : ''}><span><b>Rester sur la touche en cas d'erreur</b><small>Recommandé : tu ne passes à la suite qu'avec la bonne touche.</small></span></label>
        <label class="check"><input type="checkbox" data-set="showKeyboard"${s.showKeyboard ? ' checked' : ''}><span><b>Afficher le clavier à l'écran</b><small>Montre la touche à taper. Désactive-le quand tu te sens prêt.</small></span></label>
        <label class="check"><input type="checkbox" data-set="showHands"${s.showHands ? ' checked' : ''}><span><b>Afficher les mains</b><small>Allume le doigt qui doit frapper.</small></span></label>
        <label class="check"><input type="checkbox" data-set="showSpaces"${s.showSpaces ? ' checked' : ''}><span><b>Marquer les espaces</b><small>Un petit point entre les mots.</small></span></label>
        <label class="check"><input type="checkbox" data-set="sound"${s.sound ? ' checked' : ''}><span><b>Sons</b><small>Un petit clic à chaque touche, un son grave en cas d'erreur.</small></span></label>
      </section>
      <section class="panel stack">
        <h2>Affichage</h2>
        <div class="field"><span>Thème</span>
          <div class="chips">${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(o => `<label class="chip-radio"><input type="radio" name="theme" value="${o[0]}"${sel('theme', o[0])}><span>${o[1]}</span></label>`).join('')}</div>
        </div>
        <div class="field"><span>Taille du texte à taper</span>
          <div class="chips">${[['s', 'Petite'], ['m', 'Moyenne'], ['l', 'Grande']].map(o => `<label class="chip-radio"><input type="radio" name="textSize" value="${o[0]}"${(s.textSize || 'm') === o[0] ? ' checked' : ''}><span>${o[1]}</span></label>`).join('')}</div>
        </div>
        <div class="field"><span>Précision demandée pour valider un exercice</span>
          <div class="chips">${[85, 90, 93, 95].map(v => `<label class="chip-radio"><input type="radio" name="passAcc" value="${v}"${s.passAcc === v ? ' checked' : ''}><span>${v} %</span></label>`).join('')}</div>
        </div>
        <h2>Sauvegarde</h2>
        <p class="small"><span class="sync ${Sync.state}" data-sync>${esc(SYNC_TEXT[Sync.state])}</span></p>
        <p class="small muted">${APP_TARGET === 'artifact'
          ? 'Chaque exercice terminé est enregistré automatiquement. Quand tu ouvres le site depuis ton compte claude.ai, il est aussi copié sur ton compte. Le fichier sert de copie de secours, ou pour déplacer tes progrès à la main. Le fichier du site ouvert hors ligne garde ses progrès à part.'
          : 'Chaque exercice terminé est enregistré automatiquement sur cet appareil. Pour retrouver tes progrès sur un autre appareil, télécharge ta sauvegarde ici, puis restaure-la là-bas. Garde aussi une copie de temps en temps : si tu effaces les données du navigateur, la progression part avec.'}</p>
        <div class="cta">
          <button class="btn primary" type="button" id="expFile">Télécharger ma sauvegarde</button>
          <button class="btn" type="button" id="impPick">Restaurer depuis un fichier</button>
          <input type="file" id="impFile" accept=".json,application/json" hidden>
        </div>
        <p class="small" id="saveMsg" role="status"></p>
        <p class="small muted">Restaurer fusionne le fichier avec ta progression actuelle : on garde les meilleures étoiles et on réunit les historiques, rien n'est écrasé.</p>
        <details id="altSave" class="alt-save">
          <summary>Autre méthode : copier et coller</summary>
          <div class="stack">
            <div class="cta"><button class="btn sm" type="button" id="exp">Afficher ma sauvegarde</button></div>
            <textarea id="expBox" rows="4" readonly hidden aria-label="Sauvegarde exportée"></textarea>
            <div class="cta" id="expRow" hidden><button class="btn sm" type="button" id="expCopy">Copier</button></div>
            <label class="field" for="impBox"><span>Restaurer</span><textarea id="impBox" rows="3" placeholder="Colle ici une sauvegarde"></textarea></label>
            <div class="cta"><button class="btn sm" type="button" id="imp">Restaurer cette sauvegarde</button></div>
          </div>
        </details>
        <h2>Remise à zéro</h2>
        <div class="cta"><button class="btn danger" type="button" id="rst">Effacer ma progression</button></div>
        <div class="note warn" id="rstBox" hidden><b>Cette action efface tout : leçons, statistiques, réglages.</b>
          <div class="cta"><button class="btn danger" type="button" id="rstYes">Oui, tout effacer</button> <button class="btn ghost" type="button" id="rstNo">Annuler</button></div></div>
      </section>
    </div>`;
  },
  mount(root) {
    const s = settings();
    $$('input[name="layout"]', root).forEach(i => i.addEventListener('change', () => setKeyboard(i.value, 'manual')));
    App.cleanup = bindKbCheck(root);
    $$('input[name="theme"]', root).forEach(i => i.addEventListener('change', () => { s.theme = i.value; Store.save(); applyTheme(); }));
    $$('input[name="textSize"]', root).forEach(i => i.addEventListener('change', () => { s.textSize = i.value; Store.save(); }));
    $$('input[name="passAcc"]', root).forEach(i => i.addEventListener('change', () => { s.passAcc = +i.value; Store.save(); }));
    $$('[data-set]', root).forEach(i => i.addEventListener('change', () => { s[i.dataset.set] = i.checked; Store.save(); }));
    const msg = $('#saveMsg', root);
    // Fichier de sauvegarde : la plateforme demande confirmation (capacité « downloads »),
    // sinon, hors de claude.ai, on retombe sur un lien de téléchargement ordinaire.
    $('#expFile', root).addEventListener('click', async () => {
      const name = 'dix-doigts-sauvegarde-' + todayStr() + '.json';
      const data = Store.exportJSON();
      try {
        const dl = (window.claude && typeof window.claude.use === 'function') ? await window.claude.use('downloads') : null;
        if (dl) {
          const r = await dl.save({ filename: name, data });
          msg.textContent = r && r.status === 'saved' ? 'Fichier enregistré : ' + name : 'Fichier envoyé : ' + name;
          return;
        }
      } catch (e) {
        if (e && e.code === 'declined') { msg.textContent = 'Téléchargement annulé.'; return; }
        if (e && e.code === 'rate_limited') { msg.textContent = 'Une demande est déjà ouverte : réponds-y, puis réessaie.'; return; }
      }
      // téléphone ou tablette : la feuille de partage permet de l'enregistrer dans Fichiers ou de l'envoyer
      if (isTouchOnly() && navigator.canShare && typeof File === 'function') {
        try {
          const file = new File([data], name, { type: 'application/json' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Sauvegarde Dix Doigts' });
            msg.textContent = 'Sauvegarde partagée : ' + name;
            return;
          }
        } catch (e) {
          if (e && e.name === 'AbortError') { msg.textContent = 'Partage annulé.'; return; }
        }
      }
      try {
        const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        msg.textContent = 'Téléchargement lancé : ' + name;
      } catch (e) {
        $('#altSave', root).open = true;
        msg.textContent = 'Le téléchargement n\'est pas possible ici : utilise la méthode copier-coller ci-dessous.';
      }
    });
    $('#impPick', root).addEventListener('click', () => $('#impFile', root).click());
    $('#impFile', root).addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.size > 8e6) { msg.textContent = 'Ce fichier est trop gros pour être une sauvegarde.'; return; }
      try { Store.importJSON(await f.text()); msg.textContent = 'Sauvegarde fusionnée avec ta progression actuelle.'; applyTheme(); }
      catch (err) { msg.textContent = 'Ce fichier n\'est pas une sauvegarde valide.'; }
      e.target.value = '';
    });
    $('#exp', root).addEventListener('click', () => {
      const b = $('#expBox', root); b.hidden = false; b.value = Store.exportJSON(); b.focus(); b.select();
      $('#expRow', root).hidden = false;
    });
    $('#expCopy', root).addEventListener('click', async () => {
      const b = $('#expBox', root);
      try { await navigator.clipboard.writeText(b.value); msg.textContent = 'Copié dans le presse-papiers.'; }
      catch (e) { b.focus(); b.select(); msg.textContent = 'Sélectionné : fais Ctrl + C pour copier.'; }
    });
    $('#imp', root).addEventListener('click', () => {
      try { Store.importJSON($('#impBox', root).value.trim()); msg.textContent = 'Sauvegarde fusionnée avec ta progression actuelle.'; applyTheme(); }
      catch (e) { msg.textContent = 'Ce texte n\'est pas une sauvegarde valide.'; }
    });
    $('#rst', root).addEventListener('click', () => { $('#rstBox', root).hidden = false; });
    $('#rstNo', root).addEventListener('click', () => { $('#rstBox', root).hidden = true; });
    $('#rstYes', root).addEventListener('click', () => { Store.reset(); applyTheme(); go('home'); });
  },
};
