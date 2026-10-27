/* ============================================================
   Rangs et jauges : où se situe ta vitesse et ta précision
   Les seuils sont ceux du site (vitesse ET précision). Le seul repère
   extérieur est la moyenne d'une étude publique, indiquée à titre de
   comparaison : ce n'est pas un classement de vraies personnes.
   ============================================================ */
'use strict';

const RANKS = [
  { id: 'apprenti', name: 'Apprenti', min: 0, acc: 0, blurb: 'Tu construis ton geste : la vitesse viendra après.' },
  { id: 'bronze', name: 'Bronze', min: 15, acc: 90, blurb: 'Premier palier : plus de 15 mots par minute avec une bonne précision.' },
  { id: 'argent', name: 'Argent', min: 30, acc: 92, blurb: 'Dans la fourchette basse des utilisateurs d\'ordinateur (30 à 60 mots par minute).' },
  { id: 'or', name: 'Or', min: 45, acc: 95, blurb: 'Autour de la moyenne de l\'étude de référence (environ 52 mots par minute).' },
  { id: 'platine', name: 'Platine', min: 60, acc: 96, blurb: 'Au-dessus de la moyenne : tu écris vite et proprement.' },
  { id: 'diamant', name: 'Diamant', min: 80, acc: 97, blurb: 'Parmi les plus rapides : la moyenne est loin derrière.' },
];
const STUDY_AVG = 52;
const STUDY_URL = 'https://userinterfaces.aalto.fi/136Mkeystrokes/';

/** Indice du plus haut rang dont la vitesse ET la précision sont atteintes. */
function rankIndex(wpm, acc) {
  let idx = 0;
  RANKS.forEach((k, i) => { if (wpm >= k.min && acc >= k.acc) idx = i; });
  return idx;
}
const rankFor = (wpm, acc) => RANKS[rankIndex(wpm, acc)];

/** Rang actuel : le meilleur des cinq derniers tests (d'au moins 25 secondes). */
function currentRank() {
  const tests = Store.d.history.filter(h => h.mode === 'test' && h.secs >= 25).slice(-5);
  let best = null;
  tests.forEach(t => {
    const idx = rankIndex(t.wpm, t.acc);
    if (!best || idx > best.idx || (idx === best.idx && t.wpm > best.t.wpm)) best = { idx, r: RANKS[idx], t };
  });
  return best;
}

function nextRankHint(wpm, acc, idx) {
  const nx = RANKS[idx + 1];
  if (!nx) return 'Tu es au rang le plus haut. Garde la régularité.';
  const parts = [];
  if (wpm < nx.min) { const d = nx.min - wpm; parts.push('encore ' + d + ' mot' + (d > 1 ? 's' : '') + ' par minute'); }
  if (acc < nx.acc) parts.push('une précision d\'au moins ' + nx.acc + ' % (tu es à ' + acc + ' %)');
  return 'Pour passer ' + nx.name + ' : ' + parts.join(' et ') + '.';
}

function medalHTML(rank, size = '') {
  return `<span class="medal r-${rank.id}${size ? ' ' + size : ''}" aria-hidden="true"><svg viewBox="0 0 48 48"><circle class="ring" cx="24" cy="24" r="21"/><circle class="in" cx="24" cy="24" r="15"/><path class="star" d="M24 14l3 6.2 6.8.9-5 4.7 1.2 6.7L24 29.2l-6 3.3 1.2-6.7-5-4.7 6.8-.9z"/></svg></span>`;
}

/** Jauge horizontale : segments colorés, échelle, repères et pastille « toi ». */
function gaugeHTML(o) {
  const span = o.max - o.min;
  const pct = v => clamp((v - o.min) / span * 100, 0, 100).toFixed(2);
  const segs = o.segs.map(s => `<i class="${s.cls}" style="--w:${s.to - s.from}" title="${esc(s.label)}"></i>`).join('');
  const scale = o.scale.map(v => `<span class="g-lab" style="left:${pct(v)}%">${v}</span>`).join('');
  const marks = (o.marks || []).map(m => `<span class="g-tick ${m.cls}" style="left:${pct(m.v)}%" title="${esc(m.label)}"></span>`).join('');
  const pin = o.value != null ? `<span class="g-pin" style="left:${pct(o.value)}%"><b>Toi : ${o.value}${o.unit || ''}</b></span>` : '';
  return `<div class="gauge" role="img" aria-label="${esc(o.aria || '')}"><div class="g-rail">${pin}<div class="g-track">${segs}</div>${marks}${scale}</div></div>`;
}

function rankTableHTML(currentIdx) {
  const rows = RANKS.map((k, i) => {
    const nx = RANKS[i + 1];
    const speed = i === 0 ? 'moins de 15' : (nx ? k.min + ' à ' + (nx.min - 1) : k.min + ' et plus');
    return `<tr class="${i === currentIdx ? 'cur' : ''}"><th>${medalHTML(k, 'sm')} ${esc(k.name)}</th><td>${speed}</td><td>${i === 0 ? '–' : '≥ ' + k.acc + ' %'}</td><td>${esc(k.blurb)}</td></tr>`;
  }).join('');
  return `<div class="tbl-wrap"><table class="tbl rank-tbl"><thead><tr><th>Rang</th><th>Mots / min</th><th>Précision</th><th>Ce que ça représente</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

const STUDY_NOTE = `Repère de comparaison : <a href="${STUDY_URL}" target="_blank" rel="noopener">l'étude Aalto et Cambridge (2018)</a> sur 168 000 volontaires qui recopient des phrases, soit une moyenne d'environ ${STUDY_AVG} mots par minute, la majorité entre 30 et 60. Ce n'est ni un classement national ni un chiffre propre au français, et ces volontaires passent un test de frappe de leur plein gré. La précision est le rapport entre frappes justes et frappes totales.`;

/** Bloc « Ton niveau » : rang, jauges de vitesse et de précision, tableau des rangs. */
function levelPanelHTML() {
  const cr = currentRank();
  const base = Store.d.baseline;
  const head = cr
    ? `<div class="lv-head">${medalHTML(cr.r)}
        <div class="lv-id"><span class="kicker">Rang actuel</span><h3>${esc(cr.r.name)}</h3><p class="muted">${esc(cr.r.blurb)}</p></div>
        <div class="lv-next"><b>${cr.t.wpm} mots/min · ${cr.t.acc} %</b><p class="small muted">${esc(nextRankHint(cr.t.wpm, cr.t.acc, cr.idx))}</p></div>
      </div>`
    : `<div class="lv-head">${medalHTML(RANKS[0])}
        <div class="lv-id"><span class="kicker">Rang actuel</span><h3>Pas encore de rang</h3><p class="muted">Un test de vitesse suffit pour obtenir ton premier rang.</p></div>
        <div class="lv-next"><button class="btn primary" type="button" data-go="test">Faire un test</button></div>
      </div>`;

  const speed = gaugeHTML({
    min: 0, max: 100, scale: [0, 15, 30, 45, 60, 80, 100], unit: ' mpm',
    value: cr ? cr.t.wpm : null,
    aria: 'Vitesse en mots par minute sur l\'échelle des rangs',
    segs: RANKS.map((k, i) => ({ from: k.min, to: i < RANKS.length - 1 ? RANKS[i + 1].min : 100, cls: 'r-' + k.id, label: k.name })),
    marks: [{ v: STUDY_AVG, cls: 'avg', label: 'Moyenne de l\'étude : environ ' + STUDY_AVG + ' mots/min' }]
      .concat(base ? [{ v: base.wpm, cls: 'base', label: 'Ton point de départ : ' + base.wpm + ' mots/min' }] : []),
  });
  const acc = gaugeHTML({
    min: 80, max: 100, scale: [80, 90, 95, 98, 100], unit: ' %',
    value: cr ? cr.t.acc : null,
    aria: 'Précision en pourcentage',
    segs: [
      { from: 80, to: 90, cls: 'a-low', label: 'Moins de 90 % : à retravailler' },
      { from: 90, to: 95, cls: 'a-mid', label: '90 à 95 % : correct' },
      { from: 95, to: 98, cls: 'a-good', label: '95 à 98 % : bon' },
      { from: 98, to: 100, cls: 'a-top', label: '98 % et plus : excellent' },
    ],
  });
  const legend = `<ul class="g-legend">
      <li><i class="mk avg"></i>Moyenne de l'étude : environ ${STUDY_AVG} mots/min</li>
      ${base ? `<li><i class="mk base"></i>Ton point de départ : ${base.wpm} mots/min</li>` : ''}
    </ul>`;
  const accLegend = '<ul class="g-legend"><li><i class="sw a-low"></i>sous 90 % : à retravailler</li><li><i class="sw a-mid"></i>90 à 95 % : correct</li><li><i class="sw a-good"></i>95 à 98 % : bon</li><li><i class="sw a-top"></i>98 % et plus : excellent</li></ul>';
  return `<div class="panel level-panel">
    ${head}
    <div class="lv-gauges">
      <div><h4>Vitesse (mots par minute)</h4>${speed}${legend}</div>
      <div><h4>Précision</h4>${acc}${accLegend}</div>
    </div>
    ${cr ? `<p class="small muted">Ton rang est calculé sur le meilleur de tes ${Math.min(5, Store.d.history.filter(h => h.mode === 'test' && h.secs >= 25).length)} derniers tests de vitesse. Il faut atteindre la vitesse et la précision d'un rang pour l'obtenir.</p>` : ''}
    ${rankTableHTML(cr ? cr.idx : -1)}
    <p class="small muted">${STUDY_NOTE}</p>
  </div>`;
}
