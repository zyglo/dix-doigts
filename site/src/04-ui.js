/* ============================================================
   Composants : clavier virtuel, mains, moteur de frappe
   ============================================================ */
'use strict';

/* ---------- Clavier virtuel ---------- */
function kbHTML(id, o = {}) {
  const def = LAYOUT_DEFS[id];
  const bumps = def.bumps;
  let h = `<div class="kb${o.compact ? ' kb-compact' : ''}" data-layout="${id}" role="img" aria-label="Clavier ${esc(def.name)}">`;
  const mod = (m, shift) => `<div class="key mod" style="--w:${m[1]}"${shift ? ` data-k="${shift}"` : ''}><span class="b">${esc(m[0])}</span></div>`;
  def.rows.forEach((row, r) => {
    const m = def.mods[r] || {};
    h += '<div class="kb-row">';
    if (m.pre) h += mod(m.pre, r === 3 ? '__shiftL' : '');
    row.forEach(([b, s, f]) => {
      // µ (touche belge) est une lettre pour Unicode, mais sa « majuscule » serait un Μ grec
      const letter = isLetter(b) && b !== 'µ';
      const bump = bumps.includes(b) && r === 2;
      h += `<div class="key f-${f}${bump ? ' bump' : ''}" data-k="${esc(b)}" data-f="${f}" style="--w:1" title="${esc(FINGERS[f].n)}">` +
        (letter ? `<span class="b lt">${esc(b.toUpperCase())}</span>`
          : `<span class="s">${esc(s)}</span><span class="b">${esc(b)}</span>`) + '</div>';
    });
    if (m.post) h += mod(m.post, r === 3 ? '__shiftR' : '');
    h += '</div>';
  });
  h += `<div class="kb-row"><i style="--w:3.6"></i><div class="key f-th space" data-k=" " data-f="th" style="--w:7.2" title="Pouce"><span class="b">espace</span></div><i style="--w:4.2"></i></div>`;
  return h + '</div>';
}

function Keyboard(root) {
  const id = root.dataset.layout;
  const L = LAYOUTS[id];
  const map = new Map();
  $$('.key[data-k]', root).forEach(el => map.set(el.dataset.k, el));
  const timers = new Map();
  const api = {
    root, map, id, L,
    clear(cls) { $$('.' + cls, root).forEach(e => e.classList.remove(cls)); },
    mark(k, cls, on = true) { const e = map.get(k); if (e) e.classList.toggle(cls, on); },
    setTarget(ch, deadPending = false) {
      api.clear('is-target'); api.clear('is-shift');
      if (ch == null) return;
      const info = L.map.get(ch);
      if (!info) return;
      if (info.dead && !deadPending) { api.mark('^', 'is-target'); return; }
      api.mark(info.base, 'is-target');
      if (info.shift) api.mark(shiftFingerFor(info) === 'rp' ? '__shiftR' : '__shiftL', 'is-shift');
    },
    /** Marque les touches « nouvelles » (en couleur) et estompe les autres. */
    setFocus(chars) {
      api.clear('is-new'); api.clear('is-dim');
      const set = new Set([...chars].map(c => { const i = L.map.get(c); return i ? i.base : c; }));
      root.classList.toggle('has-focus', set.size > 0);
      map.forEach((el, k) => { if (set.has(k)) el.classList.add('is-new'); });
    },
    flash(ch, ok) {
      const info = L.map.get(ch);
      if (!info) return;
      const el = map.get(info.base); if (!el) return;
      const cls = ok ? 'is-hit' : 'is-miss';
      el.classList.remove('is-hit', 'is-miss'); void el.offsetWidth; el.classList.add(cls);
      clearTimeout(timers.get(el));
      timers.set(el, setTimeout(() => el.classList.remove(cls), 220));
    },
    /** Carte de chaleur : values = { base: 0..1 } */
    heat(values) {
      map.forEach((el, k) => {
        const v = values[k];
        if (v == null) { el.style.removeProperty('--heat'); el.classList.remove('has-heat'); }
        else { el.style.setProperty('--heat', String(v)); el.classList.add('has-heat'); }
      });
      root.classList.toggle('heatmap', Object.keys(values).length > 0);
    },
  };
  return api;
}

/* ---------- Mains ---------- */
function handsHTML() {
  const f = (k, cls = '') => `<i class="fg ${cls || 'f-' + k}" data-f="${k}"></i>`;
  return `<div class="hands" aria-hidden="true">
    <div class="hand hl">${f('lp')}${f('lr')}${f('lm')}${f('li')}${f('th', 'th')}</div>
    <div class="hand hr">${f('th', 'th')}${f('ri')}${f('rm')}${f('rr')}${f('rp')}</div>
  </div>`;
}
function setHands(root, fingers) {
  const on = new Set(fingers.filter(Boolean));
  $$('.fg', root).forEach(el => el.classList.toggle('on', on.has(el.dataset.f)));
}
function legendHTML() {
  return '<ul class="legend" aria-label="Légende des doigts">' + FINGER_ORDER.map(f =>
    `<li><i class="sw f-${f}"></i>${esc(FINGERS[f].n)}</li>`).join('') + '<li><i class="sw f-th"></i>Pouces</li></ul>';
}

/* ---------- Clavier de l'écran (téléphone, tablette sans clavier) ----------
   Un clavier physique passe par keydown, comme avant. Le clavier de l'écran,
   lui, n'apparaît que si un champ a le focus, et Android ne dit pas quelle
   touche a été tapée dans keydown : on lit donc ce qui s'ajoute dans un champ
   invisible posé sur la zone de frappe. */
const isTouchOnly = () => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; } };
const SOFT_MAP = { '’': "'", '‘': "'", 'ʼ': "'", '“': '"', '”': '"', ' ': ' ' };
function softInput(host, onChar) {
  const t = document.createElement('textarea');
  t.className = 'soft-input';
  t.rows = 1;
  t.setAttribute('aria-label', 'Zone de frappe');
  for (const [a, v] of [['autocapitalize', 'off'], ['autocomplete', 'off'], ['autocorrect', 'off'], ['spellcheck', 'false'], ['enterkeyhint', 'enter']]) t.setAttribute(a, v);
  host.appendChild(t);
  let last = '', composing = false;
  t.addEventListener('compositionstart', () => { composing = true; });
  t.addEventListener('compositionend', () => { composing = false; });
  t.addEventListener('input', () => {
    const v = t.value;
    // seuls les caractères ajoutés au bout comptent : une correction automatique qui remplace un mot est ignorée
    if (v.length > last.length && v.startsWith(last)) for (const ch of v.slice(last.length)) { if (ch !== '\n') onChar(SOFT_MAP[ch] || ch); }
    last = v;
    if (!composing && v.length > 40) { t.value = ''; last = ''; }
  });
  return {
    focus() { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } },
    blur() { t.blur(); },
  };
}

/* ---------- Moteur de frappe ---------- */
function sessionTemplate(cfg) {
  const showKb = cfg.showKeyboard !== false && settings().showKeyboard;
  const showHands = cfg.showHands !== false && settings().showHands;
  return `
  <div class="session" data-state="ready">
    <div class="s-top">
      <div class="s-title">
        <span class="kicker">${esc(cfg.kicker || '')}</span>
        <h2>${esc(cfg.title || '')}</h2>
        ${cfg.sub ? `<p class="muted">${esc(cfg.sub)}</p>` : ''}
      </div>
      <div class="s-actions">
        <button class="btn ghost" type="button" data-s="restart">Recommencer <kbd>Entrée</kbd></button>
        <button class="btn ghost" type="button" data-s="exit">Quitter <kbd>Échap</kbd></button>
      </div>
    </div>
    <div class="hud" role="status" aria-live="off">
      <div class="hud-i"><span class="v" data-hud="wpm">–</span><span class="l">mots / min</span></div>
      <div class="hud-i"><span class="v" data-hud="acc">100</span><span class="l">% précision</span></div>
      <div class="hud-i"><span class="v" data-hud="time">${cfg.timeLimit ? fmtTime(cfg.timeLimit) : '0:00'}</span><span class="l">${cfg.timeLimit ? 'restant' : 'temps'}</span></div>
      <div class="hud-i"><span class="v" data-hud="err">0</span><span class="l">erreurs</span></div>
      <div class="prog" aria-hidden="true"><i data-hud="bar"></i></div>
    </div>
    <div class="sheet" data-sheet>
      <div class="viewport"><div class="inner" data-txt></div></div>
      <div class="sheet-hint" data-hint>${isTouchOnly() ? 'Touche le texte pour faire apparaître le clavier, puis tape la première lettre.' : 'Pose tes doigts, puis tape la première touche pour démarrer.'}</div>
    </div>
    <div class="guide">
      <div class="next" data-next></div>
      ${showHands ? handsHTML() : ''}
      ${showKb ? kbHTML(cfg.layoutId || layoutId(), { compact: true }) : ''}
    </div>
  </div>`;
}

function mountSession(root, cfg) {
  const id = cfg.layoutId || layoutId();
  const L = LAYOUTS[id];
  const stopOnError = cfg.stopOnError != null ? cfg.stopOnError : settings().stopOnError;
  root.innerHTML = sessionTemplate(cfg);
  const el = $('.session', root);
  const inner = $('[data-txt]', el), sheet = $('[data-sheet]', el), hint = $('[data-hint]', el), next = $('[data-next]', el);
  const hud = k => $(`[data-hud="${k}"]`, el);
  const kbRoot = $('.kb', el);
  const kb = kbRoot ? Keyboard(kbRoot) : null;
  if (kb && cfg.focusKeys) kb.setFocus(cfg.focusKeys);
  const handsRoot = $('.hands', el);

  let text = normalizeText(cfg.text);
  let chars = [...text];
  const spans = [];
  let pos = 0, started = false, t0 = 0, hits = 0, errs = 0, lastOk = 0, finished = false, pendingDead = false, mismatch = false, lastKey = null;
  const miss = {};
  let tick = null, pitch = 0, curRow = 0, stopMetro = null;

  function renderAppend(str) {
    const frag = document.createDocumentFragment();
    let cur = null;
    for (const ch of str) {
      if (!cur) { cur = document.createElement('span'); cur.className = 'w'; frag.appendChild(cur); }
      const s = document.createElement('span');
      s.className = 'c' + (ch === ' ' ? ' sp' : '');
      s.textContent = ch === ' ' ? ' ' : ch;
      cur.appendChild(s); spans.push(s);
      if (ch === ' ') cur = null;
    }
    inner.appendChild(frag);
  }
  renderAppend(text);
  if (!settings().showSpaces) sheet.classList.add('no-spaces');
  if (cfg.blind) sheet.classList.add('blind');
  const sizeMap = { s: '1.15rem', m: '1.5rem', l: '1.95rem' };
  sheet.style.setProperty('--fs', sizeMap[settings().textSize || 'm'] || '1.5rem');

  function elapsedMs() { return started ? performance.now() - t0 : 0; }
  function wpm() { const m = elapsedMs() / 60000; return m > 0.04 ? Math.round((hits / 5) / m) : null; }
  function acc() { const t = hits + errs; return t ? Math.round(1000 * hits / t) / 10 : 100; }

  function updateHud() {
    const w = wpm();
    hud('wpm').textContent = w == null ? '–' : w;
    hud('acc').textContent = acc() % 1 === 0 ? acc() : acc().toFixed(1);
    hud('err').textContent = errs;
    let t = elapsedMs() / 1000;
    if (cfg.timeLimit) {
      hud('time').textContent = fmtTime(Math.max(0, Math.ceil(cfg.timeLimit - t)));
      hud('bar').style.width = clamp(100 * t / cfg.timeLimit, 0, 100) + '%';
    } else {
      hud('time').textContent = fmtTime(t);
      hud('bar').style.width = clamp(100 * pos / Math.max(1, chars.length), 0, 100) + '%';
    }
  }

  function updateGuide() {
    const ch = chars[pos];
    if (ch == null) return;
    const info = L.map.get(ch);
    if (kb) kb.setTarget(ch, pendingDead);
    const fingers = [];
    let label = '';
    if (!info) { label = `Tape ${kbd(ch)}`; }
    else if (info.dead && !pendingDead) {
      const caret = L.map.get('^');
      fingers.push(caret.f);
      label = `Touche ${kbd('^')} (touche morte), puis ${kbd(info.base)}`;
    } else {
      fingers.push(info.f);
      if (info.shift) {
        const sf = shiftFingerFor(info); fingers.push(sf);
        label = `<kbd>Maj</kbd> (${FINGERS[sf].n.toLowerCase()}) + ${kbd(info.base)} (${FINGERS[info.f].n.toLowerCase()})`;
        if (isLetter(ch)) label = `Majuscule : <kbd>Maj</kbd> (${FINGERS[sf].n.toLowerCase()}) + ${kbd(ch)}`;
      } else {
        label = ch === ' ' ? 'Barre d\'espace, avec le pouce' : `${kbd(ch)}, ${FINGERS[info.f].n.toLowerCase()}`;
      }
    }
    next.innerHTML = `<span class="l">Prochaine touche</span><span class="t">${label}</span>`;
    if (handsRoot) setHands(handsRoot, fingers);
  }

  function setCurrent() {
    spans.forEach((s, i) => { if (s.classList.contains('cur') && i !== pos) s.classList.remove('cur'); });
    const s = spans[pos];
    if (s) {
      s.classList.add('cur');
      const wrap = s.parentNode;
      if (!pitch) { const lh = parseFloat(getComputedStyle(inner).lineHeight); pitch = lh || 48; }
      const row = Math.round(wrap.offsetTop / pitch);
      if (row !== curRow) {
        curRow = row;
        inner.style.transform = `translateY(${-Math.max(0, row - 1) * pitch}px)`;
      }
    }
  }

  function maybeExtend() {
    if (!cfg.extend) return;
    if (chars.length - pos > 90) return;
    const more = cfg.extend();
    if (!more) return;
    const add = ' ' + normalizeText(more);
    chars = chars.concat([...add]);
    text += add;
    renderAppend(add);
  }

  function finish(reason) {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    if (stopMetro) stopMetro();
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    soft.blur();
    el.dataset.state = 'done';
    const secs = Math.max(0.5, elapsedMs() / 1000);
    const res = {
      secs, hits, errs, reason,
      acc: acc(), wpm: Math.round((hits / 5) / (secs / 60)),
      cpm: Math.round(hits / (secs / 60)),
      len: chars.length, miss,
    };
    Sound.done();
    cfg.onFinish && cfg.onFinish(res);
  }

  function onKeyUp(e) {
    // évite qu'un bouton focalisé soit activé par la barre d'espace
    if (e.key === ' ' && !finished) e.preventDefault();
  }

  function onKey(e) {
    if (finished) return;
    if (e.key === 'Escape') { e.preventDefault(); destroy(); cfg.onExit && cfg.onExit(); return; }
    if ((e.ctrlKey || e.altKey || e.metaKey) && !(e.getModifierState && e.getModifierState('AltGraph'))) return;
    const k = e.key;
    if (k === 'Enter' || k === 'Tab') {
      // aucune frappe d'exercice n'utilise ces touches : elles servent à recommencer
      e.preventDefault();
      if (e.repeat) return;
      destroy();
      cfg.onRestart ? cfg.onRestart() : mountSession(root, cfg);
      return;
    }
    if (k === 'Dead') {
      e.preventDefault();
      if (!started) { started = true; t0 = performance.now(); el.dataset.state = 'run'; hint.classList.add('hide'); }
      pendingDead = true; updateGuide(); return;
    }
    if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'AltGraph' || k === 'CapsLock' || k === 'Meta' || k === 'Tab' ||
      k === 'ContextMenu' || k === 'OS' || k === 'Unidentified' || /^F\d+$/.test(k)) return;
    if (k.length !== 1) { if (k === 'Backspace' || k === 'Enter') e.preventDefault(); return; }
    e.preventDefault();
    if (e.getModifierState && e.getModifierState('CapsLock') && /[a-zà-ÿ]/.test(chars[pos] || '') && k !== chars[pos]) {
      hint.textContent = 'La touche Verr Maj est activée : appuie dessus pour la désactiver.'; hint.classList.remove('hide'); hint.classList.add('warn');
    }
    lastKey = { ch: k, t: performance.now() };
    typeChar(k, e);
  }

  /** Une frappe, qu'elle vienne d'un clavier physique (e) ou du clavier de l'écran (e = null). */
  function typeChar(k, e) {
    const now = performance.now();
    if (!started) { started = true; t0 = now; lastOk = now; el.dataset.state = 'run'; hint.classList.add('hide'); }
    if (e && !mismatch) {
      // la frappe révèle un autre clavier que celui du réglage : le clavier à l'écran ne serait pas juste
      const seen = detectLayout(e);
      if (seen && seen !== id) {
        mismatch = true;
        hint.textContent = `Ton clavier ressemble à un ${LAYOUT_DEFS[seen].name}, mais le site est réglé sur ${LAYOUT_DEFS[id].name} : le clavier à l'écran ne correspond pas. Corrige-le dans Réglages, rubrique Clavier.`;
        hint.classList.remove('hide'); hint.classList.add('warn');
      }
    }
    const expected = chars[pos];
    pendingDead = false;
    if (k === expected) {
      hits++;
      addKeyStat(id, expected, true, now - lastOk);
      lastOk = now;
      const s = spans[pos]; s.classList.remove('cur', 'bad'); s.classList.add(s.dataset.err ? 'fixed' : 'ok');
      if (kb) kb.flash(expected, true);
      pos++;
      Sound.ok();
      maybeExtend();
      if (pos >= chars.length) { updateHud(); finish('end'); return; }
      setCurrent(); updateGuide(); updateHud();
    } else {
      errs++;
      miss[expected] = (miss[expected] || 0) + 1;
      addKeyStat(id, expected, false, 0);
      Sound.err();
      if (kb) { kb.flash(k, false); }
      const s = spans[pos];
      s.dataset.err = '1';
      s.classList.add('bad');
      sheet.classList.remove('shake'); void sheet.offsetWidth; sheet.classList.add('shake');
      if (!stopOnError) {
        s.classList.remove('cur', 'bad'); s.classList.add('wrong');
        pos++;
        maybeExtend();
        if (pos >= chars.length) { updateHud(); finish('end'); return; }
        setCurrent(); updateGuide();
      }
      updateHud();
    }
  }

  function destroy() {
    finished = true;
    clearInterval(tick);
    if (stopMetro) stopMetro();
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    soft.blur();
  }

  $('[data-s="exit"]', el).addEventListener('click', () => { destroy(); cfg.onExit && cfg.onExit(); });
  $('[data-s="restart"]', el).addEventListener('click', () => { destroy(); cfg.onRestart ? cfg.onRestart() : mountSession(root, cfg); });

  // clavier de l'écran : une frappe déjà comptée par keydown n'est pas recomptée
  const soft = softInput(sheet, ch => {
    if (finished) return;
    if (lastKey && lastKey.ch === ch && performance.now() - lastKey.t < 150) { lastKey = null; return; }
    typeChar(ch, null);
  });
  sheet.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') soft.focus(); });

  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (isTouchOnly()) soft.focus();
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKeyUp, true);
  tick = setInterval(() => {
    if (!started || finished) return;
    updateHud();
    if (cfg.timeLimit && elapsedMs() >= cfg.timeLimit * 1000) finish('time');
  }, 200);
  if (cfg.rhythm) {
    const ms = 60000 / cfg.rhythm;
    const m = setInterval(() => { Sound.tick(); const p = $('.prog', el); if (p) { p.classList.remove('pulse'); void p.offsetWidth; p.classList.add('pulse'); } }, ms);
    stopMetro = () => clearInterval(m);
  }
  setCurrent(); updateGuide(); updateHud();
  return { destroy };
}

/* ---------- Petits composants HTML ---------- */
function starsHTML(n, max = 3) {
  let s = '<span class="stars" aria-label="' + n + ' sur ' + max + ' étoiles">';
  for (let i = 0; i < max; i++) s += `<svg viewBox="0 0 20 20" class="${i < n ? 'on' : ''}" aria-hidden="true"><path d="M10 1.6l2.5 5.5 6 .7-4.4 4.1 1.2 5.9L10 14.8 4.7 17.8l1.2-5.9L1.5 7.8l6-.7z"/></svg>`;
  return s + '</span>';
}
function ringHTML(pct, label, size = 76) {
  const r = 30, c = 2 * Math.PI * r, off = c * (1 - clamp(pct, 0, 100) / 100);
  return `<div class="ring" style="--s:${size}px"><svg viewBox="0 0 76 76" aria-hidden="true"><circle class="bg" cx="38" cy="38" r="${r}"/><circle class="fg" cx="38" cy="38" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg><span>${esc(label)}</span></div>`;
}
