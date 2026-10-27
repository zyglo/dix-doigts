/* ============================================================
   Noyau : utilitaires, stockage, claviers, générateurs d'exercices
   ============================================================ */
'use strict';

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad2 = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isLetter = ch => /\p{L}/u.test(ch);
const stripAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const fmtTime = s => { s = Math.round(s); const m = Math.floor(s / 60); return m + ':' + pad2(s % 60); };
const fmtDur = s => { s = Math.round(s); if (s < 60) return s + ' s'; const m = Math.round(s / 60); if (m < 60) return m + ' min'; return Math.floor(m / 60) + ' h ' + pad2(m % 60); };
/** Texte propre à une disposition : { a, b, q } ; le belge reprend a, le QWERTY aussi à défaut de q. */
const tx = (v, id) => {
  if (!v || typeof v !== 'object') return v;
  const w = id === 'qwerty' ? v.q : (id === 'be' && v.b != null ? v.b : v.a);
  return w != null ? w : v.a;
};

/* ---------- Stockage (tolérant : localStorage peut être indisponible) ---------- */
const DEFAULTS = () => ({
  v: 1,
  // layout : famille du clavier ('azerty' ou 'qwerty', comme avant) ; variant : 'fr' ou 'be' pour un AZERTY.
  // kbChecked : le clavier a été reconnu ou choisi (sert à ne poser la question qu'une fois).
  settings: { layout: 'azerty', variant: 'fr', kbChecked: false, stopOnError: true, sound: false, showKeyboard: true, showHands: true, showSpaces: true, passAcc: 90, theme: 'auto' },
  lessons: {},                 // id -> { stages: { [i]: {stars, acc, wpm} }, done }
  history: [],                 // { t, mode, ref, wpm, acc, secs, chars, errs }
  keys: { azerty: {}, qwerty: {} }, // base -> { h, m, t, n }
  days: {},                    // 'AAAA-MM-JJ' -> secondes
  best: { test: 0, game: 0 },
  baseline: null,              // premier test de vitesse
  updatedAt: 0,                // horodatage de la dernière sauvegarde (sert à la synchronisation)
});
const Store = {
  KEY: 'dix-doigts.v1', d: null,
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { raw = null; }
    const base = DEFAULTS();
    if (raw && typeof raw === 'object') {
      Object.assign(base, raw);
      base.settings = Object.assign(DEFAULTS().settings, raw.settings || {});
      base.keys = Object.assign(DEFAULTS().keys, raw.keys || {});
      base.best = Object.assign(DEFAULTS().best, raw.best || {});
    }
    this.d = base;
  },
  persistLocal() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { /* ignoré */ } },
  save() {
    this.d.updatedAt = Date.now();
    this.persistLocal();
    try { Sync.schedule(); } catch (e) { /* synchronisation pas encore chargée */ }
  },
  reset() { this.d = DEFAULTS(); this.save(); },
  exportJSON() { return JSON.stringify(this.d); },
  /** Fusionne une sauvegarde avec la progression actuelle (rien n'est écrasé). */
  importJSON(txt) {
    const raw = JSON.parse(txt);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !raw.settings || typeof raw.settings !== 'object') throw new Error('format');
    const obj = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
    const clean = Object.assign(DEFAULTS(), {
      settings: Object.assign(DEFAULTS().settings, raw.settings),
      lessons: obj(raw.lessons),
      history: Array.isArray(raw.history) ? raw.history.filter(h => h && ['t', 'wpm', 'acc', 'secs'].every(k => typeof h[k] === 'number')) : [],
      keys: Object.assign(DEFAULTS().keys, obj(raw.keys)),
      days: obj(raw.days),
      best: Object.assign(DEFAULTS().best, obj(raw.best)),
      baseline: raw.baseline && typeof raw.baseline === 'object' ? raw.baseline : null,
      updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    });
    this.d = mergeProgress(this.d, clean);
    this.save();
  },
};
const settings = () => Store.d.settings;
/** Disposition en vigueur : 'azerty' (français), 'be' (belge) ou 'qwerty'. Les sauvegardes
 *  gardent `layout` = famille, ce qui les laisse lisibles par les versions précédentes. */
const layoutId = () => {
  const s = settings();
  if (s.layout === 'qwerty') return 'qwerty';
  return s.variant === 'be' ? 'be' : 'azerty';
};
function setLayoutId(id) {
  const s = settings();
  if (id === 'qwerty') { s.layout = 'qwerty'; return; }
  s.layout = 'azerty';
  s.variant = id === 'be' ? 'be' : 'fr';
}
/** Famille d'une disposition : le français et le belge sont tous deux des AZERTY. */
const isAz = id => LAYOUT_DEFS[id].family === 'azerty';
/** Statistiques par touche : une seule série par famille (même clavier physique, mêmes lettres). */
const statsOf = id => Store.d.keys[LAYOUT_DEFS[id].family] || {};

/* ---------- Claviers ---------- */
function compileLayout(def) {
  const map = new Map();
  def.rows.forEach((row, r) => row.forEach(([b, s, f], c) => {
    map.set(b, { base: b, r, c, shift: false, f });
    if (s) map.set(s, { base: b, r, c, shift: true, f });
  }));
  map.set(' ', { base: ' ', r: 4, c: 0, shift: false, f: 'th' });
  if (def.family === 'azerty') {
    const circ = { 'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u' };
    for (const ch in circ) { const v = map.get(circ[ch]); map.set(ch, { base: circ[ch], r: v.r, c: v.c, shift: false, f: v.f, dead: '^' }); }
  }
  return { def, id: def.id, map };
}
const LAYOUTS = {};
for (const k of Object.keys(LAYOUT_DEFS)) LAYOUTS[k] = compileLayout(LAYOUT_DEFS[k]);
const curLayout = () => LAYOUTS[layoutId()];
const handOf = (ch, L = curLayout()) => { const i = L.map.get(ch); return i ? FINGERS[i.f].hand : null; };
const fingerOf = (ch, L = curLayout()) => { const i = L.map.get(ch); return i ? i.f : null; };
/** Touche Maj à utiliser : du côté opposé à la main qui frappe. */
const shiftFingerFor = info => FINGERS[info.f].hand === 'L' ? 'rp' : 'lp';
function keyLabel(ch) {
  if (ch === ' ') return 'Espace';
  if (ch === 'µ') return ch; // signe micro : sa majuscule serait la lettre grecque Μ
  return isLetter(ch) ? ch.toUpperCase() : ch;
}
const kbd = ch => '<kbd>' + esc(keyLabel(ch)) + '</kbd>';
function fillKeys(str, keys) {
  if (!str) return '';
  const arr = [...(keys || '')];
  let out = str.replace(/\{K(\d)\}/g, (m, i) => arr[+i - 1] != null ? kbd(arr[+i - 1]) : '');
  out = out.replace(/\{KS\}/g, arr.map(kbd).join(' '));
  return out;
}

/* ---------- Leçons par disposition ---------- */
const lessonsFor = id => LESSONS.filter(l => !l.only || l.only === LAYOUT_DEFS[id].family);
const keysOf = (lesson, id) => tx(lesson.k, id) || '';
const lessonTitle = (l, id) => tx(l.title, id);
function learnedAt(id, idx) {
  const set = new Set([' ']); let caps = false;
  const ls = lessonsFor(id);
  for (let i = 0; i <= idx && i < ls.length; i++) {
    for (const ch of keysOf(ls[i], id)) set.add(ch);
    if (ls[i].caps) caps = true;
  }
  return { set, caps };
}

/* ---------- Corpus par disposition ---------- */
const _corp = {};
function corpusFor(id) {
  if (_corp[id]) return _corp[id];
  const L = LAYOUTS[id];
  const norm = isAz(id) ? (s => s.normalize('NFC')) : (s => stripAcc(s));
  const ok = s => [...s].every(ch => L.map.has(ch));
  const uniq = a => Array.from(new Set(a));
  const words = uniq(WORDS_RAW.split(/\s+/).filter(Boolean).map(norm)).filter(ok);
  const sentences = uniq(SENTENCES_RAW.map(norm)).filter(ok);
  const texts = uniq(TEXTS_RAW.map(norm)).filter(ok);
  const names = uniq(NAMES_RAW.split(/\s+/).map(norm)).filter(ok);
  const cities = uniq(CITIES_RAW.split(/\s+/).map(norm)).filter(ok);
  const bigrams = BIGRAMS_RAW.split(/\s+/);
  const trigrams = TRIGRAMS_RAW.split(/\s+/);
  const punct = PUNCT_PHRASES.map(norm).filter(ok);
  // chaîne de Markov simple sur les lettres, pour fabriquer des « mots » prononçables
  const markov = {};
  for (const w of words) {
    const plain = stripAcc(w);
    let prev = '^';
    for (const ch of plain + '$') { (markov[prev] = markov[prev] || {})[ch] = (markov[prev][ch] || 0) + 1; prev = ch; }
  }
  return (_corp[id] = { words, sentences, texts, names, cities, bigrams, trigrams, punct, markov });
}
const PUNCT_PHRASES = [
  "Comment vas-tu?", "Quelle heure est-il?", "Tu viens avec nous?", "Pourquoi pas?", "C'est vrai?", "Où est la gare?",
  "Qui es-tu?", "Combien ça coûte?", "Bravo!", "Courage!", "Attention!", "Vite!", "Super!", "Quelle surprise!",
  "Merci beaucoup!", "Attention: danger.", "Rappel: réunion à neuf heures.", "Résultat: dix sur dix.",
  "Au menu: soupe, pain et fromage.", "Idée: partir tôt.", "Pain; beurre; lait.",
  "Un jour, deux nuits; trois fois, quatre mots.", "Il aime lire; elle préfère écrire.", "Un porte-clés.",
  "Un rendez-vous.", "Peut-être demain.", "Vingt-deux, trente-trois.", "Après-midi.", "C'est-à-dire.", "Grand-mère.",
  "Bonjour! Comment vas-tu? Très bien: merci.", "Premier: la posture; deuxième: le rythme; troisième: la précision!",
];

/* ---------- Contexte de génération ---------- */
function makeCtx(id, learned, newKeys = []) {
  const L = LAYOUTS[id];
  const corpus = corpusFor(id);
  const allow = ch => learned.set.has(ch) || (learned.caps && isLetter(ch) && learned.set.has(ch.toLowerCase()));
  const letters = [...learned.set].filter(isLetter);
  const plain = letters.filter(c => /[a-z]/.test(c));
  const nk = [...newKeys];
  return {
    id, L, corpus, learned, allow, letters, plain: plain.length ? plain : ['f', 'j'],
    newKeys: nk,
    newPlain: nk.filter(c => /[a-z]/.test(c)),
    oldPlain: plain.filter(c => !nk.includes(c)),
    digits: [...learned.set].filter(c => /\d/.test(c)),
  };
}
function ctxForLesson(lesson, id) {
  const ls = lessonsFor(id);
  const idx = Math.max(0, ls.indexOf(lesson));
  return makeCtx(id, learnedAt(id, idx), keysOf(lesson, id));
}
/** Contexte « tout est permis » pour les tests de vitesse et le jeu. */
function ctxAll(id) {
  const L = LAYOUTS[id];
  const set = new Set([' ']);
  for (const ch of L.map.keys()) if (isLetter(ch) || /\d|[.,;:!?'\-]/.test(ch)) set.add(ch);
  return makeCtx(id, { set, caps: true }, []);
}

/* ---------- Générateurs ---------- */
function build(n, next) {
  const out = []; let len = 0, g = 0;
  while (len < n && g++ < 600) { const t = next(); if (!t) continue; out.push(t); len += t.length + 1; }
  return out.join(' ');
}
function weighted(opts) {
  let tot = 0; for (const o of opts) tot += Math.sqrt(o[1]);
  let r = Math.random() * tot;
  for (const o of opts) { r -= Math.sqrt(o[1]); if (r <= 0) return o[0]; }
  return opts[opts.length - 1][0];
}
const VOWELS = 'aeiouy';
/** Suite de lettres tirées au hasard, sans triple répétition, en évitant les doublons. */
function randomLetters(ctx, mustP, minL, maxL) {
  const P = ctx.plain, L = minL + rnd(maxL - minL + 1);
  let w = '';
  for (let i = 0; i < L; i++) {
    let ch, g = 0;
    do { ch = pick(P); g++; } while (w.length && ch === w[w.length - 1] && (g < 8) && (Math.random() < .75 || w.endsWith(ch + ch)));
    w += ch;
  }
  if (mustP.length && !mustP.some(m => w.includes(m))) { const p = rnd(L); w = w.slice(0, p) + pick(mustP) + w.slice(p + 1); }
  return w;
}
function pseudoWord(ctx, must = [], minL = 3, maxL = 6) {
  const M = ctx.corpus.markov, allowed = new Set(ctx.plain);
  const mustP = must.filter(c => /[a-z]/.test(c));
  // sans voyelle, la chaîne de Markov n'a rien de crédible à proposer
  if (!ctx.plain.some(c => VOWELS.includes(c))) return randomLetters(ctx, mustP, minL, maxL);
  for (let a = 0; a < 14; a++) {
    let w = '', prev = '^';
    const target = minL + rnd(maxL - minL + 1);
    for (;;) {
      const row = M[prev]; const opts = [];
      if (row) for (const ch in row) {
        if (ch === '$') { if (w.length >= minL) opts.push([ch, row[ch]]); }
        else if (allowed.has(ch) && !(VOWELS.includes(ch) && w.endsWith(ch))) opts.push([ch, row[ch]]);
      }
      if (!opts.length) break;
      const c = weighted(opts);
      if (c === '$') break;
      w += c; prev = c;
      if (w.length >= target) break;
    }
    if (w.length >= minL && [...w].some(ch => VOWELS.includes(ch)) && (!mustP.length || mustP.some(m => w.includes(m)))) return w;
  }
  const L = minL + rnd(maxL - minL + 1);
  let w = ''; for (let i = 0; i < L; i++) w += pick(ctx.plain);
  if (mustP.length && !mustP.some(m => w.includes(m))) { const p = rnd(L); w = w.slice(0, p) + pick(mustP) + w.slice(p + 1); }
  return w;
}
function wordPool(ctx, o = {}) {
  const must = o.must || [], min = o.min || 1, max = o.max || 99;
  return ctx.corpus.words.filter(w => w.length >= min && w.length <= max &&
    [...w].every(ch => ctx.allow(ch)) && (!must.length || must.some(m => w.includes(m))));
}
function sentenceSimplify(s, ctx) {
  let t = s;
  if (!ctx.learned.caps) t = t.toLowerCase();
  t = [...t].filter(ch => !(',.!?;:'.includes(ch) && !ctx.allow(ch))).join('');
  t = t.replace(/\s+/g, ' ').trim();
  for (const ch of t) if (!ctx.allow(ch)) return null;
  return t || null;
}
function sentencePool(ctx, list, mustAny) {
  const out = [];
  for (const s of list || ctx.corpus.sentences) {
    const t = sentenceSimplify(s, ctx);
    if (!t) continue;
    if (mustAny && mustAny.length && ![...t].some(c => mustAny.includes(c))) continue;
    out.push(t);
  }
  return out;
}
function pickUnique(pool, n, joiner = ' ') {
  if (!pool.length) return '';
  let bag = shuffle(pool), out = [], len = 0, last = '';
  while (len < n) {
    if (!bag.length) bag = shuffle(pool);
    const t = bag.pop();
    if (t === last && pool.length > 1) continue;
    out.push(t); last = t; len += t.length + joiner.length;
    if (out.length > 200) break;
  }
  return out.join(joiner);
}
const digitOf = (pool, len) => { let s = ''; for (let i = 0; i < len; i++) s += pick(pool); return s; };

function aposList(c) {
  const base = ["l'eau", "d'un", "j'ai", "c'est", "qu'il", "n'est", "s'il", "m'a", "t'as", "l'ami", "d'abord", "aujourd'hui",
    "l'idée", "n'a", "j'aime", "l'heure", "qu'elle", "l'été", "d'accord", "s'est", "j'étais", "l'école", "l'argent", "d'hier"];
  return base.map(w => isAz(c.id) ? w : stripAcc(w)).filter(w => [...w].every(ch => c.allow(ch)));
}

const GEN = {
  pat(c, n) {
    const K = c.newKeys.length ? c.newKeys : c.plain;
    const t = build(n, () => { const L = 2 + rnd(3); let s = ''; for (let i = 0; i < L; i++) s += pick(K); return s; });
    const missing = K.filter(k => !t.includes(k));
    return (t + ' ' + missing.map(k => k + k).join(' ')).trim();
  },
  alt(c, n) {
    const K = c.newKeys.length ? c.newKeys : c.plain, O = c.oldPlain;
    if (!O.length) return build(n, () => { const a = pick(K), b = pick(K); return a + b + a + (Math.random() < .5 ? b : ''); });
    return build(n, () => {
      const L = 2 + rnd(2); const t = [];
      for (let i = 0; i < L; i++) t.push(i % 2 ? pick(O) : pick(K));
      if (Math.random() < .5) t.reverse();
      return t.join('');
    });
  },
  rhythm(c, n) {
    const K = c.newKeys.length ? c.newKeys : c.plain;
    const O = c.oldPlain.length ? c.oldPlain : K;
    return build(n, () => {
      const a = pick(K), b = Math.random() < .6 ? pick(K) : pick(O);
      return pick([a + b + a + b, a + a + b + b, a + b + b + a, a + a + a + b, b + a + a + a, a + b + a]);
    });
  },
  pseudo(c, n) { return build(n, () => pseudoWord(c, c.newPlain, 3, 5)); },
  pseudoLong(c, n) { return build(n, () => pseudoWord(c, c.newPlain, 4, 7)); },
  words(c, n, o = {}) {
    const pool = wordPool(c, o);
    return pool.length >= 6 ? pickUnique(pool, n) : GEN.pseudoLong(c, n);
  },
  wordsNew(c, n) {
    const pool = wordPool(c, { must: c.newPlain });
    return pool.length >= 6 ? pickUnique(pool, n) : GEN.pseudoLong(c, n);
  },
  mixAll(c, n) {
    const pool = wordPool(c);
    if (pool.length < 6) return GEN.pseudoLong(c, n);
    const newPool = c.newPlain.length ? wordPool(c, { must: c.newPlain }) : [];
    let last = '';
    return build(n, () => {
      let t;
      for (let g = 0; g < 6; g++) {
        t = (newPool.length >= 3 && Math.random() < .35) ? pick(newPool) : pick(pool);
        if (t !== last) break;
      }
      last = t; return t;
    });
  },
  sentences(c, n, o = {}) {
    const pool = sentencePool(c, null, o.must);
    return pool.length >= 5 ? pickUnique(pool, n) : GEN.mixAll(c, n);
  },
  sentencesWithNew(c, n) {
    const pool = sentencePool(c, null, c.newKeys);
    return pool.length >= 5 ? pickUnique(pool, n) : GEN.sentences(c, n);
  },
  text(c, n) {
    const pool = sentencePool(c, c.corpus.texts);
    if (!pool.length) return GEN.sentences(c, n);
    let t = pick(pool);
    if (t.length < n * 0.7) t += ' ' + pick(pool.filter(p => p !== t) .concat(pool));
    return t;
  },
  text2(c, n) {
    const pool = sentencePool(c, c.corpus.texts);
    if (!pool.length) return GEN.sentences(c, n);
    return shuffle(pool).slice(0, 2).join(' ');
  },
  capsLetters(c, n) {
    const P = c.plain;
    return build(n, () => { const a = pick(P).toUpperCase(); let s = a; const L = 1 + rnd(3); for (let i = 0; i < L; i++) s += pick(P); return s; });
  },
  names(c, n) {
    const pool = c.corpus.names.filter(w => [...w].every(ch => c.allow(ch)));
    return pool.length >= 4 ? pickUnique(pool, n) : GEN.capsLetters(c, n);
  },
  cities(c, n) {
    const pool = c.corpus.cities.filter(w => [...w].every(ch => c.allow(ch)));
    return pool.length >= 4 ? pickUnique(pool, n) : GEN.names(c, n);
  },
  mixCaps(c, n) {
    const a = c.corpus.names.concat(c.corpus.cities).filter(w => [...w].every(ch => c.allow(ch)));
    const s = sentencePool(c);
    const parts = [];
    let len = 0;
    while (len < n) {
      const t = Math.random() < .5 && a.length ? pickUnique(a, 12) : (s.length ? pick(s) : GEN.words(c, 20));
      parts.push(t); len += t.length + 1;
    }
    return parts.join(' ');
  },
  punctWords(c, n, o = {}) {
    const marks = (o.marks || ['.']).filter(m => c.allow(m));
    const pool = wordPool(c, { min: 2, max: 8 });
    if (!pool.length || !marks.length) return GEN.words(c, n);
    const ap = marks.includes("'") ? aposList(c) : [];
    const ends = marks.filter(m => m !== "'");
    return build(n, () => {
      if (ap.length && (!ends.length || Math.random() < .45)) return pick(ap);
      return pick(pool) + (ends.length ? pick(ends) : '');
    });
  },
  apos(c, n) {
    const pool = aposList(c);
    return pool.length >= 4 ? pickUnique(pool, n) : GEN.words(c, n);
  },
  accentPat(c, n, o = {}) {
    const keys = [...(o.keys || c.newKeys.join(''))].filter(k => c.allow(k) && !/\d/.test(k));
    const base = c.plain.filter(x => 'edrstlmnaiopu'.includes(x));
    if (!keys.length) return GEN.words(c, n);
    return build(n, () => {
      const a = pick(keys); const b = pick(base.length ? base : c.plain);
      const r = Math.random();
      return r < .33 ? a + b : r < .66 ? b + a : a + a;
    });
  },
  accWords(c, n, o = {}) {
    let keys = [...(o.keys || c.newKeys.join(''))];
    let pool = wordPool(c, { must: keys });
    if (pool.length < 4) pool = wordPool(c, { must: [...'éèêàùçâîôû'] });
    return pool.length ? pickUnique(pool, n) : GEN.words(c, n);
  },
  puncts(c, n, o = {}) {
    const marks = o.marks;
    let pool = c.corpus.punct.filter(s => [...s].every(ch => c.allow(ch)));
    if (marks) { const f = pool.filter(s => marks.some(m => s.includes(m))); if (f.length) pool = f; }
    if (!pool.length) return GEN.sentences(c, n);
    return pickUnique(pool, n);
  },
  digPat(c, n, o = {}) {
    const D = o.all ? c.digits : (c.newKeys.filter(k => /\d/.test(k)));
    const P = D.length ? D : c.digits;
    return build(n, () => digitOf(P, 2 + rnd(3)));
  },
  digNums(c, n, o = {}) {
    const D = (o.all ? c.digits : c.newKeys.filter(k => /\d/.test(k)));
    const P = D.length ? D : c.digits;
    return build(n, () => digitOf(P, 2 + rnd(4)));
  },
  digMix(c, n, o = {}) {
    const D = c.newKeys.filter(k => /\d/.test(k));
    const P = D.length ? D : c.digits;
    const pool = wordPool(c, { min: 3, max: 8 });
    return build(n, () => digitOf(P, 1 + rnd(2)) + ' ' + (pool.length ? pick(pool) : pseudoWord(c, [], 3, 6)));
  },
  times(c, n) { return build(n, () => pad2(rnd(24)) + ':' + pad2(rnd(60))); },
  prices(c, n) { return build(n, () => (1 + rnd(250)) + ',' + pad2(rnd(100))); },
  dates(c, n) { return build(n, () => pad2(1 + rnd(28)) + '-' + pad2(1 + rnd(12)) + '-' + (1990 + rnd(40))); },
  phones(c, n) {
    const t = build(n, () => '0' + (1 + rnd(7)) + ' ' + pad2(rnd(100)) + ' ' + pad2(rnd(100)) + ' ' + pad2(rnd(100)) + ' ' + pad2(rnd(100)) + ',');
    return t.replace(/,$/, '');
  },
  numMix(c, n) {
    const gens = [GEN.times, GEN.prices, GEN.dates, GEN.phones];
    const pool = wordPool(c, { min: 3, max: 8 });
    const sents = sentencePool(c);
    return build(n, () => {
      const r = Math.random();
      if (r < .45) return pick(gens)(c, 8);
      return pool.length ? pick(pool) : pseudoWord(c, [], 3, 6);
    });
  },
  bigrams(c, n) {
    const pool = c.corpus.bigrams.filter(b => [...b].every(ch => c.allow(ch)));
    if (!pool.length) return GEN.pseudo(c, n);
    return build(n, () => {
      const p = pick(pool); const r = Math.random();
      if (p[0] === p[1]) return r < .5 ? p : p + ' ' + p;
      return r < .35 ? p : r < .7 ? p + p : p + [...p].reverse().join('');
    });
  },
  trigrams(c, n) {
    const pool = c.corpus.trigrams.filter(b => [...b].every(ch => c.allow(ch)));
    if (!pool.length) return GEN.bigrams(c, n);
    return build(n, () => { const p = pick(pool); return Math.random() < .5 ? p : p + ' ' + p; });
  },
  bigramWords(c, n) {
    const bs = c.corpus.bigrams.filter(b => [...b].every(ch => c.allow(ch)));
    const pool = wordPool(c, { min: 4 }).filter(w => bs.some(b => w.includes(b)));
    return pool.length >= 6 ? pickUnique(pool, n) : GEN.words(c, n);
  },
  shortWords(c, n, o = {}) {
    const pool = wordPool(c, { min: 2, max: o.max || 5 });
    return pool.length >= 6 ? pickUnique(pool, n) : GEN.words(c, n);
  },
  longWords(c, n, o = {}) {
    const pool = wordPool(c, { min: o.min || 7, max: o.max || 99 });
    return pool.length >= 4 ? pickUnique(pool, n) : GEN.words(c, n);
  },
  altWords(c, n) {
    const alt = w => {
      const p = stripAcc(w);
      for (let i = 0; i < p.length - 1; i++) { const a = handOf(p[i], c.L), b = handOf(p[i + 1], c.L); if (!a || !b || a === b) return false; }
      return p.length >= 3;
    };
    const pool = wordPool(c, { min: 3 }).filter(alt);
    return pool.length >= 6 ? pickUnique(pool, n) : GEN.words(c, n);
  },
  sameFingerWords(c, n, o = {}) {
    const sf = w => {
      const p = stripAcc(w);
      for (let i = 0; i < p.length - 1; i++) { if (p[i] !== p[i + 1] && fingerOf(p[i], c.L) && fingerOf(p[i], c.L) === fingerOf(p[i + 1], c.L)) return true; }
      return false;
    };
    const pool = wordPool(c, { min: 3, max: o.max || 99 }).filter(sf);
    return pool.length >= 6 ? pickUnique(pool, n) : GEN.words(c, n);
  },
  /** Entraînement ciblé : mots qui contiennent les touches les plus ratées. */
  weak(c, n) {
    const must = c.newKeys.filter(isLetter);
    const pool = wordPool(c, { must, min: 3 });
    if (pool.length >= 6) return pickUnique(pool, n);
    return GEN.pseudoLong(c, n);
  },
};

/* ---------- Étapes d'une leçon ---------- */
function stagesOf(lesson, id) {
  const c = ctxForLesson(lesson, id);
  const defGoal = settings().passAcc;
  let raw;
  const hasVowel = c.plain.some(ch => VOWELS.includes(ch));
  if (lesson.stages) raw = lesson.stages.map(s => Object.assign({}, s));
  else if (!hasVowel && lesson.type === 'review') {
    raw = [
      { name: 'Mélange de touches', d: 'Les touches de la rangée, en vrac', gen: 'pseudo', n: 60 },
      { name: 'Rythme', d: 'Des motifs qui alternent les mains', gen: 'rhythm', n: 60 },
      { name: 'Séries courtes', d: 'Trois à cinq touches', gen: 'pseudo', n: 80 },
      { name: 'Séries longues', d: 'Cinq à sept touches', gen: 'pseudoLong', n: 100 },
      { name: 'Défi', d: 'Précision avant la vitesse', gen: 'pseudoLong', n: 130, goalAcc: 94 },
    ];
  } else if (!hasVowel) {
    raw = [
      { name: 'Repérage', d: 'Les nouvelles touches, seules', gen: 'pat', n: 36 },
      { name: 'Alternance', d: 'Nouvelles touches et anciennes', gen: 'alt', n: 48 },
      { name: 'Rythme', d: 'Des motifs qui alternent les mains', gen: 'rhythm', n: 54 },
      { name: 'Séries courtes', d: 'Trois à cinq touches', gen: 'pseudo', n: 70 },
      { name: 'Séries longues', d: 'Cinq à sept touches', gen: 'pseudoLong', n: 90 },
      { name: 'Défi', d: 'Tout ce que tu sais, mélangé', gen: 'pseudoLong', n: 120, goalAcc: 94 },
    ];
  } else if (lesson.type === 'review') {
    raw = [
      { name: 'Mélange de touches', d: 'Les touches de la leçon, en vrac', gen: 'pseudo', n: 60 },
      { name: 'Mots', d: 'De vrais mots', gen: 'wordsNew', n: 70 },
      { name: 'Mots variés', d: 'Toutes les touches apprises', gen: 'mixAll', n: 90 },
      { name: 'Phrases', d: 'Dans une phrase complète', gen: 'sentencesWithNew', n: 110 },
      { name: 'Défi', d: 'Précision avant la vitesse', gen: 'mixAll', n: 130, goalAcc: 94 },
    ];
  } else {
    raw = [
      { name: 'Repérage', d: 'Les nouvelles touches, seules', gen: 'pat', n: 36 },
      { name: 'Alternance', d: 'Nouvelles touches et anciennes', gen: 'alt', n: 48 },
      { name: 'Syllabes', d: 'Combinaisons pour automatiser le geste', gen: 'pseudo', n: 54 },
      { name: 'Mots', d: 'De vrais mots avec les nouvelles touches', gen: 'wordsNew', n: 70 },
      { name: 'Phrases', d: 'Dans une phrase complète', gen: 'sentencesWithNew', n: 100 },
      { name: 'Défi', d: 'Tout ce que tu sais, mélangé', gen: 'mixAll', n: 120, goalAcc: 94 },
    ];
  }
  // si le vocabulaire disponible est trop pauvre, on bascule sur des séries de lettres
  raw.forEach(s => {
    s.goalAcc = s.goalAcc || defGoal;
    if (s.gen === 'wordsNew' || s.gen === 'mixAll') {
      const p = wordPool(c, s.gen === 'wordsNew' ? { must: c.newPlain } : {});
      if (p.length < 6) { s.gen = 'pseudoLong'; if (s.name === 'Mots' || s.name === 'Mots variés') { s.name = 'Séries'; s.d = 'Des séries de lettres plus longues'; } }
    }
    if (s.gen === 'sentencesWithNew' || s.gen === 'sentences') {
      const p = s.gen === 'sentencesWithNew' ? sentencePool(c, null, c.newKeys) : [];
      if (p.length < 5) {
        const q = sentencePool(c);
        if (q.length >= 5) s.gen = 'sentences';
        else { s.gen = 'mixAll'; if (s.name === 'Phrases') { s.name = 'Mots enchaînés'; s.d = 'Des mots à la suite, sans pause'; } }
      }
    }
  });
  return raw.map((s, i) => Object.assign(s, { i }));
}
function genStage(stage, lesson, id) {
  const c = ctxForLesson(lesson, id);
  const f = GEN[stage.gen] || GEN.words;
  const t = f(c, stage.n, stage.opts || {});
  return normalizeText(t);
}
function normalizeText(t) {
  return String(t).normalize('NFC').replace(/\s+/g, ' ').trim();
}

/* ---------- Progression ---------- */
const stageRec = (lessonId, i) => ((Store.d.lessons[lessonId] || {}).stages || {})[i] || null;
function lessonState(lesson, id) {
  const st = stagesOf(lesson, id);
  let done = 0, stars = 0;
  st.forEach(s => { const r = stageRec(lesson.id, s.i); if (r && r.stars > 0) { done++; stars += r.stars; } });
  return { total: st.length, done, stars, max: st.length * 3, complete: done === st.length };
}
function starsFor(acc, goal) {
  if (acc >= Math.max(98, goal + 5)) return 3;
  if (acc >= goal + 3) return 2;
  if (acc >= goal) return 1;
  return 0;
}
function nextLesson(id) {
  const ls = lessonsFor(id);
  return ls.find(l => !lessonState(l, id).complete) || null;
}
function courseProgress(id) {
  const ls = lessonsFor(id);
  let done = 0; ls.forEach(l => { if (lessonState(l, id).complete) done++; });
  return { done, total: ls.length };
}

/* ---------- Statistiques ---------- */
function addKeyStat(id, ch, ok, dt) {
  const info = LAYOUTS[id].map.get(ch);
  const b = info ? info.base : ch;
  const fam = LAYOUT_DEFS[id].family;
  const m = Store.d.keys[fam] || (Store.d.keys[fam] = {});
  const r = m[b] || (m[b] = { h: 0, m: 0, t: 0, n: 0 });
  if (ok) { r.h++; if (dt > 0 && dt < 1500) { r.t += dt; r.n++; } } else r.m++;
}
function logSession(entry) {
  const d = Store.d;
  d.history.push(entry);
  if (d.history.length > 600) d.history.splice(0, d.history.length - 600);
  const day = todayStr();
  d.days[day] = (d.days[day] || 0) + Math.round(entry.secs);
  if (entry.mode === 'test') {
    if (!d.baseline) d.baseline = { t: entry.t, wpm: entry.wpm, acc: entry.acc };
    if (entry.wpm > d.best.test && entry.acc >= 90) d.best.test = entry.wpm;
  }
  Store.save();
}
function streakDays() {
  const days = Store.d.days; let n = 0;
  const d = new Date();
  const key = x => x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
  if (!days[key(d)]) d.setDate(d.getDate() - 1);
  while (days[key(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function weakKeys(id, count = 6, minSeen = 6) {
  const m = statsOf(id);
  const rows = Object.entries(m).map(([k, r]) => {
    const seen = r.h + r.m;
    return { k, seen, err: seen ? r.m / seen : 0, ms: r.n ? r.t / r.n : 0, m: r.m };
  }).filter(r => r.seen >= minSeen && /[a-zàâçéèêîôùû]/.test(r.k));
  rows.sort((a, b) => (b.err - a.err) || (b.ms - a.ms));
  return rows.slice(0, count);
}

/* ---------- Son (WebAudio, démarre après un geste) ---------- */
const Sound = {
  ctx: null,
  _c() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } }
    return this.ctx;
  },
  tone(freq, dur, type = 'sine', vol = 0.05) {
    const c = this._c(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
    } catch (e) { /* ignoré */ }
  },
  ok() { if (settings().sound) this.tone(660, 0.04, 'triangle', 0.03); },
  err() { if (settings().sound) this.tone(150, 0.12, 'square', 0.04); },
  done() { if (settings().sound) { this.tone(523, 0.12, 'triangle', 0.05); setTimeout(() => this.tone(784, 0.18, 'triangle', 0.05), 110); } },
  tick() { this.tone(1000, 0.03, 'square', 0.03); },
};
