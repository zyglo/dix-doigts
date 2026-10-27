/* ============================================================
   Synchronisation : double la sauvegarde du navigateur (localStorage)
   avec un document privé du compte, via la capacité `db` de claude.ai.
   Le site fonctionne à l'identique sans elle (fichier local, session
   fermée, capacité absente) : seule la sauvegarde en ligne disparaît.
   ============================================================ */
'use strict';

/** Fusionne deux sauvegardes sans rien perdre de l'une ni de l'autre. */
function mergeProgress(a, b) {
  a = a || {}; b = b || {};
  const newer = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  const older = newer === a ? b : a;
  const m = Object.assign(DEFAULTS(), older, newer);
  m.settings = Object.assign(DEFAULTS().settings, older.settings || {}, newer.settings || {});
  // leçons : on garde le meilleur résultat de chaque exercice
  m.lessons = {};
  for (const src of [older, newer]) {
    for (const lid of Object.keys(src.lessons || {})) {
      const dst = m.lessons[lid] || (m.lessons[lid] = { stages: {} });
      const st = (src.lessons[lid] || {}).stages || {};
      for (const i of Object.keys(st)) {
        const r = st[i], cur = dst.stages[i];
        if (!cur || r.stars > cur.stars || (r.stars === cur.stars && r.acc > cur.acc)) dst.stages[i] = r;
      }
    }
  }
  // historique : union, sans doublon
  const seen = new Set(), hist = [];
  for (const h of (a.history || []).concat(b.history || [])) {
    const k = h.t + ':' + (h.mode || '') + ':' + (h.ref || '');
    if (seen.has(k)) continue;
    seen.add(k); hist.push(h);
  }
  hist.sort((x, y) => x.t - y.t);
  m.history = hist.slice(-600);
  // jours : le plus long des deux
  m.days = {};
  for (const src of [a, b]) for (const d of Object.keys(src.days || {})) m.days[d] = Math.max(m.days[d] || 0, src.days[d]);
  // statistiques par touche : on garde, pour chaque touche, la série la mieux fournie
  m.keys = { azerty: {}, qwerty: {} };
  for (const lay of ['azerty', 'qwerty']) {
    const ka = (a.keys || {})[lay] || {}, kb = (b.keys || {})[lay] || {};
    for (const k of new Set(Object.keys(ka).concat(Object.keys(kb)))) {
      const ra = ka[k], rb = kb[k];
      const na = ra ? ra.h + ra.m : -1, nb = rb ? rb.h + rb.m : -1;
      m.keys[lay][k] = na >= nb ? ra : rb;
    }
  }
  m.best = {
    test: Math.max((a.best || {}).test || 0, (b.best || {}).test || 0),
    game: Math.max((a.best || {}).game || 0, (b.best || {}).game || 0),
  };
  const ba = a.baseline, bb = b.baseline;
  m.baseline = ba && bb ? (ba.t <= bb.t ? ba : bb) : (ba || bb || null);
  m.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return m;
}

const SYNC_TEXT = {
  local: 'Enregistré sur cet appareil',
  connecting: 'Connexion à ta sauvegarde…',
  ok: 'Sauvegardé sur ton compte',
  saving: 'Sauvegarde en cours…',
  error: 'Sauvegarde en ligne indisponible, enregistré sur cet appareil',
};

const Sync = {
  state: 'local', ref: null, timer: null, busy: false, dirty: false, lastJSON: '',

  setState(s) {
    this.state = s;
    document.querySelectorAll('[data-sync]').forEach(el => {
      el.textContent = SYNC_TEXT[s] || SYNC_TEXT.local;
      el.className = 'sync ' + s;
    });
  },

  async init() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') { this.setState('local'); return; }
      this.setState('connecting');
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) { this.setState('local'); return; }
      const id = await user.id();
      if (!id) { this.setState('local'); return; }
      this.ref = db.doc('data/users/' + id + '/progress');
      const snap = await this.ref.get();
      let remote = null;
      if (snap.exists) {
        const body = snap.data() || {};
        try { remote = JSON.parse(body.payload); } catch (e) { remote = null; }
        this.lastJSON = typeof body.payload === 'string' ? body.payload : '';
      }
      if (remote && remote.settings) {
        const merged = mergeProgress(Store.d, remote);
        const changed = JSON.stringify(merged) !== JSON.stringify(Store.d);
        Store.d = merged;
        Store.persistLocal();
        if (changed) this.refreshView();
      }
      this.setState('ok');
      await this.push(true);
    } catch (e) {
      this.setState('error');
    }
  },

  /** Réaffiche la page courante si elle montre des progrès et qu'aucun exercice n'est en cours. */
  refreshView() {
    if (['home', 'cours', 'lecon', 'stats', 'test', 'reglages'].includes(App.page)) {
      try { applyTheme(); render(); } catch (e) { /* ignoré */ }
    }
  },

  schedule() {
    if (!this.ref) return;
    this.dirty = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), 2500);
  },

  /** Écrit le document si son contenu a changé. `force` : première écriture après fusion. */
  async push(force) {
    if (!this.ref) return;
    if (this.busy) { this.dirty = true; return; }
    this.busy = true;
    try {
      do {
        this.dirty = false;
        let json = JSON.stringify(Store.d);
        if (json.length > 230000) json = JSON.stringify(Object.assign({}, Store.d, { history: Store.d.history.slice(-200) }));
        if (json !== this.lastJSON) {
          this.setState('saving');
          await this.ref.set({ v: 1, updatedAt: Store.d.updatedAt || Date.now(), payload: json });
          this.lastJSON = json;
        }
      } while (this.dirty);
      this.setState('ok');
    } catch (e) {
      this.setState('error');
    } finally {
      this.busy = false;
    }
  },

  /** Envoie tout de suite si des changements attendent (fermeture ou changement d'onglet). */
  flush() {
    if (this.ref && this.dirty) { clearTimeout(this.timer); this.push(); }
  },
};

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Sync.flush(); });
window.addEventListener('pagehide', () => Sync.flush());
