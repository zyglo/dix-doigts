/* ============================================================
   Pages : accueil, guide, parcours, leçon, exécution
   ============================================================ */
'use strict';

const PAGES = {};
const App = { page: 'home', param: null, cleanup: null, run: null, kbNote: null };
const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

const keycapsHTML = (keys, id = layoutId()) => [...keys].map(ch => {
  const i = LAYOUTS[id].map.get(ch);
  return `<span class="kc${i ? ' f-' + i.f : ''}"><kbd>${esc(keyLabel(ch))}</kbd></span>`;
}).join('');

/* ---------- Reconnaissance du clavier (accueil et réglages) ---------- */
/** Message affiché après un changement de disposition, tant qu'on reste sur la page. */
function kbNoteHTML() {
  const n = App.kbNote;
  return n ? `<div class="note tip kb-note" role="status"><b>${esc(n.title)}</b> ${esc(n.text)}</div>` : '';
}
/** Règle la disposition, la marque comme vérifiée et réaffiche la page. */
function setKeyboard(id, how) {
  setLayoutId(id);
  settings().kbChecked = true;
  Store.save();
  App.kbNote = { title: (how === 'auto' ? 'Clavier reconnu : ' : 'Clavier réglé : ') + LAYOUT_DEFS[id].name + '.', text: LAYOUT_DEFS[id].hint + '. Le clavier à l\'écran, les doigts et les leçons suivent ce clavier ; tu peux le changer dans les réglages.' };
  render();
}
/** Encart de l'accueil, tant que la disposition n'a été ni reconnue ni choisie. */
function kbCheckHTML() {
  if (settings().kbChecked) return '';
  const cur = layoutId();
  const opts = Object.values(LAYOUT_DEFS).map(l =>
    `<button class="btn${l.id === cur ? ' ghost' : ''}" type="button" data-kb="${l.id}">${esc(l.name)}</button>`).join('');
  return `<section class="panel kb-check" aria-labelledby="h-kbc">
    <h2 id="h-kbc">Quel est ton clavier ?</h2>
    <p>Les signes de ponctuation ne sont pas au même endroit sur un clavier français, belge ou QWERTY. Pour que le clavier à l'écran et les consignes soient justes, appuie sur la touche <b>8</b> de la rangée du haut, sans Maj : le site reconnaît ta disposition tout seul.</p>
    <p class="small muted" data-kbc-status role="status">En attente de ta frappe. Si rien ne se passe, clique une fois dans la page puis recommence, ou choisis à la main :</p>
    <div class="cta">${opts}</div>
  </section>`;
}
/** Écoute la frappe : les touches 8, 6, = et ! suffisent à reconnaître la disposition. */
function bindKbCheck(root) {
  const status = $('[data-kbc-status]', root);
  const onKey = e => {
    const t = e.target;
    if (t && t.tagName && (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
      (t.tagName === 'INPUT' && !['radio', 'checkbox', 'button', 'file', 'range'].includes(t.type)))) return;
    const seen = detectLayout(e);
    if (!seen) return;
    if (seen === layoutId() && settings().kbChecked) {
      if (status) status.textContent = 'Confirmé : ' + LAYOUT_DEFS[seen].hint + '.';
      return;
    }
    setKeyboard(seen, 'auto');
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

/* ============================================================
   ACCUEIL
   ============================================================ */
PAGES.home = {
  html() {
    const id = layoutId();
    const prog = courseProgress(id);
    const nx = nextLesson(id);
    const pct = Math.round(100 * prog.done / prog.total);
    const d = Store.d;
    const lastTests = d.history.filter(h => h.mode === 'test');
    const lastT = lastTests[lastTests.length - 1];
    const cr = currentRank();
    const base = d.baseline;
    const ls = lessonsFor(id);
    const idxNext = nx ? ls.indexOf(nx) + 1 : 0;
    const startLabel = !nx ? 'Revoir les leçons' : (prog.done === 0 && !Object.keys(d.lessons).length ? 'Commencer la leçon 1' : 'Continuer : leçon ' + idxNext);
    const mods = MODULES.map(m => {
      const lsm = ls.filter(l => l.m === m.id);
      if (!lsm.length) return '';
      const done = lsm.filter(l => lessonState(l, id).complete).length;
      return `<button class="mod-card" type="button" data-go="cours">
        <span class="mc-title">${esc(m.title)}</span>
        <span class="mc-blurb">${esc(m.blurb)}</span>
        <span class="mc-foot"><span>${lsm.length} leçons</span><span class="mc-done">${done} / ${lsm.length}</span></span>
        <span class="mc-bar"><i style="width:${Math.round(100 * done / lsm.length)}%"></i></span>
      </button>`;
    }).join('');

    return `
    ${kbNoteHTML()}${kbCheckHTML()}${touchNoteHTML()}${installCardHTML()}
    <section class="hero">
      <div class="hero-copy">
        <p class="kicker">Dactylographie en français</p>
        <h1>Passe de deux index à dix doigts.</h1>
        <p class="lead">Un parcours pas à pas : des explications claires, ${ls.length} leçons, des exercices générés à la volée et un suivi de tes progrès. Quinze minutes par jour suffisent.</p>
        <div class="cta">
          <button class="btn primary lg" type="button" data-go="${nx ? 'lecon:' + nx.id : 'cours'}">${esc(startLabel)}</button>
          <button class="btn lg" type="button" data-go="guide">Comprendre la méthode</button>
        </div>
        <p class="small muted">Clavier ${esc(LAYOUT_DEFS[id].name)}. Tu peux le changer dans les <button class="link" type="button" data-go="reglages">réglages</button>.</p>
      </div>
      <div class="hero-demo" aria-label="Démonstration : les doigts qui tapent « dix doigts »">
        <div class="sheet mini"><div class="viewport"><div class="inner" id="demoText"></div></div></div>
        ${handsHTML()}
        ${kbHTML(id)}
        ${legendHTML()}
      </div>
    </section>

    <section class="band" aria-labelledby="h-where">
      <h2 id="h-where">Ton point de départ</h2>
      <div class="grid g3">
        <div class="panel stat">
          ${ringHTML(pct, pct + ' %')}
          <div><b>${prog.done} leçon${prog.done > 1 ? 's' : ''} sur ${prog.total}</b><p class="muted small">${nx ? 'Prochaine : ' + esc(lessonTitle(nx, id)) : 'Parcours terminé, bravo !'}</p></div>
        </div>
        <div class="panel stat">
          <div class="big-n">${cr ? cr.t.wpm : (lastT ? lastT.wpm : (base ? base.wpm : '–'))}<small>mots / min</small></div>
          <div><b class="rank-line">${cr ? medalHTML(cr.r, 'sm') + ' Rang ' + esc(cr.r.name) : 'Pas encore de rang'}</b>
          <p class="muted small">${cr ? esc(nextRankHint(cr.t.wpm, cr.t.acc, cr.idx)) : 'Fais un test d\'une minute pour savoir d\'où tu pars.'}</p></div>
        </div>
        <div class="panel stat">
          <div class="big-n">${streakDays()}<small>jour${streakDays() > 1 ? 's' : ''} de suite</small></div>
          <div><b>${fmtDur(d.days[todayStr()] || 0)} aujourd'hui</b><p class="muted small">Courtes séances, tous les jours : c'est la clé.</p></div>
        </div>
      </div>
      <div class="cta-row"><button class="btn" type="button" data-go="test">Faire un test de vitesse</button><button class="btn ghost" type="button" data-go="stats">Voir mes statistiques</button></div>
    </section>

    <section class="band" aria-labelledby="h-path">
      <h2 id="h-path">Le parcours</h2>
      <div class="grid g3 mods">${mods}</div>
    </section>

    <section class="band" aria-labelledby="h-how">
      <h2 id="h-how">Comment ça marche</h2>
      <ol class="steps">
        <li><b>Comprends le geste.</b><span>Chaque leçon commence par une explication : quel doigt, quelle touche, quelle erreur éviter. Le guide détaille la posture et la position de départ.</span></li>
        <li><b>Répète avec des exercices variés.</b><span>Six à sept exercices par leçon : touches seules, alternances, syllabes, mots, phrases, défi. Les textes changent à chaque fois.</span></li>
        <li><b>Mesure et corrige.</b><span>Précision, vitesse, touches ratées. L'entraînement ciblé génère des exercices sur tes points faibles.</span></li>
      </ol>
    </section>

    <section class="band callout-band" aria-labelledby="h-index">
      <h2 id="h-index">Si tu viens des deux index</h2>
      <div class="grid g3">
        <div><h3>Tu vas d'abord ralentir.</h3><p>C'est normal et temporaire : tu remplaces un automatisme par un autre. Compte quelques semaines avant de retrouver ta vitesse actuelle, puis tu la dépasses.</p></div>
        <div><h3>Sépare l'entraînement du quotidien.</h3><p>Pendant les premières semaines, tape comme avant dans la vie courante et réserve les dix doigts à tes séances. Tu passeras de l'un à l'autre quand le geste sera sûr.</p></div>
        <div><h3>La précision avant la vitesse.</h3><p>Chaque exercice te donne un pourcentage de précision. Tant qu'il est sous 90 %, ralentis : le cerveau retient ce que tu répètes, y compris les erreurs.</p></div>
      </div>
      <div class="cta-row"><button class="btn" type="button" data-go="guide">Lire le guide complet</button></div>
    </section>`;
  },
  mount(root) {
    const id = layoutId();
    const offs = [];
    App.cleanup = () => offs.forEach(f => { try { f(); } catch (e) { /* ignoré */ } });
    if (!settings().kbChecked) offs.push(bindKbCheck(root));
    $$('[data-kb]', root).forEach(b => b.addEventListener('click', () => setKeyboard(b.dataset.kb, 'manual')));
    bindInstall(root);
    const demo = $('#demoText', root);
    const kbRoot = $('.kb', root);
    const kb = Keyboard(kbRoot);
    const hands = $('.hands', root);
    const phrase = 'dix doigts, dix touches';
    const spans = [...phrase].map(ch => { const s = document.createElement('span'); s.className = 'c' + (ch === ' ' ? ' sp' : ''); s.textContent = ch === ' ' ? ' ' : ch; demo.appendChild(s); return s; });
    // coloration permanente du clavier : chaque couleur est un doigt
    if (reduceMotion()) { spans.forEach(s => s.classList.add('ok')); return; }
    let i = 0;
    const step = () => {
      spans.forEach((s, k) => { s.classList.toggle('ok', k < i); s.classList.toggle('cur', k === i); });
      const ch = phrase[i];
      kb.setTarget(ch);
      const info = LAYOUTS[id].map.get(ch);
      setHands(hands, info ? [info.f] : []);
      i = (i + 1) % (phrase.length + 2);
      if (i > phrase.length) { kb.setTarget(null); setHands(hands, []); }
    };
    step();
    const t = setInterval(step, 560);
    offs.push(() => clearInterval(t));
  },
};

/* ============================================================
   GUIDE
   ============================================================ */
PAGES.guide = {
  html() {
    const id = layoutId();
    const L = LAYOUT_DEFS[id];
    const homeKeys = L.home;
    const plan = [
      ['Semaine 1', 'Leçons 1 à 6', '15 min par jour', 'Taper la rangée de base sans regarder, avec au moins 90 % de précision. La vitesse n\'a aucune importance.'],
      ['Semaine 2', 'Leçons 7 à 12', '15 à 20 min par jour', 'Taper de vrais mots lentement, avec les bons doigts. Les erreurs doivent devenir rares.'],
      ['Semaine 3', 'Leçons 13 à 18', '20 min par jour', 'L\'alphabet complet, des phrases lentes, les majuscules et la ponctuation de base.'],
      ['Semaine 4', 'Leçons 19 à 24', '20 min par jour', 'Accents, ponctuation, chiffres. Premiers tests : tu approches de ta vitesse d\'avant.'],
      ['Ensuite', 'Leçons 25 à 31', 'selon ton envie', 'Fluidité et vitesse. Tests réguliers, entraînement ciblé sur tes touches faibles.'],
    ];
    const faq = [
      ['Combien de temps avant de dépasser ma vitesse avec deux index ?', 'Cela varie d\'une personne à l\'autre. Avec quinze à vingt minutes par jour, beaucoup de gens retrouvent leur vitesse actuelle en trois à six semaines, puis la dépassent. La régularité compte plus que la durée de chaque séance.'],
      ['Je fais plus d\'erreurs qu\'avant, c\'est normal ?', 'Oui. Tu apprends un nouveau geste, donc le cerveau hésite. Ralentis jusqu\'à retrouver 95 % de précision, puis accélère progressivement. Une erreur répétée devient une habitude : mieux vaut aller lentement.'],
      ['Puis-je continuer à taper à deux index au travail ?', 'Oui, au début. Dès que tu as terminé les leçons de la rangée du haut, essaie de taper tes messages courts avec les dix doigts. Si tu perds trop de temps, retourne à l\'ancienne méthode pour les tâches urgentes, et garde les dix doigts pour tes séances.'],
      ['Je suis gaucher, est-ce un problème ?', 'Non. Les deux mains apprennent le même répertoire de touches. Tu auras peut-être un peu plus de mal avec la main droite au début, c\'est tout.'],
      ['Mes doigts sont courts, longs, ou j\'ai de grandes mains…', 'La méthode fonctionne quelle que soit la taille de tes mains. Tu ajustes seulement l\'écart des doigts et la hauteur du poignet.'],
      ['Mon clavier n\'a pas de repères sur F et J.', 'Presque tous les claviers en ont, mais ils peuvent être usés. Tu peux coller un petit point adhésif ou repérer les touches du milieu de la rangée de base avec le bout des doigts.'],
      ['J\'ai mal aux mains ou aux poignets.', 'Arrête et fais une pause. Vérifie ta posture : poignets droits, épaules relâchées, frappe légère. Si la douleur revient, parles-en à un professionnel de santé : un exercice ne vaut pas une blessure.'],
      ['Mon clavier n\'est pas un AZERTY français.', 'Dans les réglages, choisis AZERTY belge ou QWERTY : le clavier à l\'écran, les doigts et les consignes suivent la disposition choisie. Le site peut aussi la reconnaître : appuie sur la touche 8 de la rangée du haut, sans Maj. Un point d\'exclamation « ! » indique un clavier belge, un tiret du bas « _ » un clavier français, un « 8 » un clavier QWERTY.'],
      ['Où sont passés le point d\'exclamation et le tiret ?', 'Ils ne sont pas au même endroit sur tous les AZERTY. Sur un clavier français, ! est la dernière touche de la rangée du bas et le tiret est sur la touche 6. Sur un clavier belge, ! est sur la touche 8 et le tiret est tout à droite de la rangée des chiffres. Le clavier à l\'écran du site montre toujours l\'emplacement réel de la disposition choisie.'],
    ];
    return `
    <header class="page-head">
      <p class="kicker">Le guide</p>
      <h1>Comprendre avant de s'entraîner</h1>
      <p class="lead">Dix minutes de lecture ici t'éviteront des semaines de mauvaises habitudes. Tu peux revenir sur cette page à tout moment.</p>
      <nav class="toc" aria-label="Sommaire">
        <button class="chip" type="button" data-scroll="g-pourquoi">Pourquoi dix doigts</button>
        <button class="chip" type="button" data-scroll="g-posture">Posture</button>
        <button class="chip" type="button" data-scroll="g-depart">Position de départ</button>
        <button class="chip" type="button" data-scroll="g-carte">Carte des doigts</button>
        <button class="chip" type="button" data-scroll="g-mot">Décortiquer un mot</button>
        <button class="chip" type="button" data-scroll="g-regles">Règles d'or</button>
        <button class="chip" type="button" data-scroll="g-index">Depuis deux index</button>
        <button class="chip" type="button" data-scroll="g-faq">Questions</button>
      </nav>
    </header>

    <section class="band" id="g-pourquoi">
      <h2>Pourquoi laisser les deux index ?</h2>
      <p class="prose">Taper avec deux doigts marche, c'est une méthode que tu maîtrises. Mais elle a un plafond : un doigt par main doit parcourir tout le clavier, et les yeux doivent suivre. Avec dix doigts, chaque doigt garde sa zone, et les mains se préparent à l'avance. Les ordres de grandeur ci-dessous sont des repères, pas des promesses.</p>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th></th><th>Deux index</th><th>Dix doigts</th></tr></thead>
        <tbody>
          <tr><th>Vitesse typique</th><td>15 à 30 mots par minute</td><td>40 à 80 mots par minute avec de la pratique</td></tr>
          <tr><th>Les yeux</th><td>Sur le clavier, puis sur l'écran, en alternance</td><td>Sur l'écran, tout le temps</td></tr>
          <tr><th>Le travail</th><td>Deux doigts font tout</td><td>Huit doigts et deux pouces se partagent la tâche</td></tr>
          <tr><th>La marge de progrès</th><td>Atteinte assez vite</td><td>Beaucoup plus haute</td></tr>
          <tr><th>La fatigue</th><td>Concentrée sur les index</td><td>Répartie sur les deux mains</td></tr>
        </tbody>
      </table></div>
    </section>

    <section class="band" id="g-posture">
      <h2>La posture</h2>
      <div class="grid g3 tiles">
        <div class="tile"><h3>Dos et épaules</h3><p>Dos droit, appuyé au dossier. Les épaules sont basses et relâchées, pas montées vers les oreilles.</p></div>
        <div class="tile"><h3>Coudes et bras</h3><p>Les coudes sont près du corps, ouverts à environ 90 degrés. Les avant-bras sont à peu près horizontaux.</p></div>
        <div class="tile"><h3>Poignets</h3><p>Droits, dans le prolongement de l'avant-bras. Ils ne reposent pas sur la table pendant que tu tapes : ils flottent légèrement.</p></div>
        <div class="tile"><h3>Doigts</h3><p>Courbés, comme si tu tenais une petite balle. Tu frappes avec le bout du doigt, pas avec la pulpe à plat.</p></div>
        <div class="tile"><h3>Écran</h3><p>À hauteur des yeux, à une longueur de bras environ. Le haut de l'écran est à peu près au niveau du regard.</p></div>
        <div class="tile"><h3>Pieds et pauses</h3><p>Pieds à plat au sol. Toutes les vingt minutes environ, lève-toi, secoue les mains et regarde au loin.</p></div>
      </div>
    </section>

    <section class="band" id="g-depart">
      <h2>La position de départ</h2>
      <div class="split">
        <div>
          <p class="prose">Tes doigts ont une « maison » : la rangée de base. Les quatre doigts de chaque main reposent sur les touches ${[...L.homeLeft].map(kbd).join(' ')} à gauche et ${[...L.homeRight].map(kbd).join(' ')} à droite. Les pouces flottent au-dessus de la barre d'espace.</p>
          <p class="prose">Les touches ${kbd('f')} et ${kbd('j')} ont un petit relief : c'est ton repère. Quand tu perds la position, tes index les retrouvent sans les yeux. Après chaque frappe, le doigt revient sur sa touche de base.</p>
          <div class="note tip"><b>À essayer maintenant.</b> Ferme les yeux, pose les mains sur le clavier, puis cherche les deux reliefs avec tes index. Les autres doigts tombent à côté.</div>
        </div>
        <div class="kb-wrap" id="kbHome">${kbHTML(id)}</div>
      </div>
    </section>

    <section class="band" id="g-carte">
      <h2>Quel doigt pour quelle touche ?</h2>
      <p class="prose">Chaque couleur est un doigt. Les touches du même colorié sont tapées par le même doigt, à n'importe quelle rangée. Clique sur une touche pour voir son doigt.</p>
      <div class="kb-wrap" id="kbMap">${kbHTML(id)}</div>
      ${legendHTML()}
      <div class="panel key-info" id="keyInfo" aria-live="polite"><span class="muted">Clique sur une touche du clavier.</span></div>
    </section>

    <section class="band" id="g-mot">
      <h2>Décortiquer un mot</h2>
      <p class="prose">Écris un mot ou une phrase courte : le site te montre quel doigt tape chaque lettre, et si les mains alternent.</p>
      <div class="panel">
        <label class="field" for="wordIn"><span>Ton mot</span><input id="wordIn" type="text" value="bonjour" maxlength="40" autocomplete="off" spellcheck="false"></label>
        <div class="chain" id="chain" aria-live="polite"></div>
        <p class="small muted" id="chainSum"></p>
      </div>
    </section>

    <section class="band" id="g-regles">
      <h2>Les huit règles d'or</h2>
      <div class="grid g4 rules">
        <div class="tile"><h3>Les yeux sur l'écran</h3><p>Ne regarde pas le clavier, même quand tu hésites. Tes doigts retrouvent la touche à force d'essais : c'est ainsi que la mémoire se construit.</p></div>
        <div class="tile"><h3>Chaque doigt a son territoire</h3><p>Une touche, un doigt. Même si un autre doigt est plus proche, résiste : c'est ce qui rend la frappe automatique.</p></div>
        <div class="tile"><h3>Retour à la base</h3><p>Après chaque frappe, le doigt revient sur la rangée de base. Les repères sous tes index font le reste.</p></div>
        <div class="tile"><h3>Précision d'abord</h3><p>La vitesse est la conséquence de la précision. Vise 95 %, puis accélère doucement.</p></div>
        <div class="tile"><h3>Un rythme régulier</h3><p>Mieux vaut un tempo constant et calme que des rafales suivies de pauses.</p></div>
        <div class="tile"><h3>Un seul pouce pour l'espace</h3><p>Choisis celui qui te convient (souvent le droit) et garde-le. Un pouce, une habitude.</p></div>
        <div class="tile"><h3>Maj du côté opposé</h3><p>Pour une majuscule, tu maintiens Maj de la main qui ne tape pas la lettre.</p></div>
        <div class="tile"><h3>Court, et chaque jour</h3><p>Quinze à vingt minutes quotidiennes valent mieux qu'une heure le dimanche : le geste se consolide entre les séances.</p></div>
      </div>
    </section>

    <section class="band" id="g-index">
      <h2>Quand on vient des deux index</h2>
      <div class="grid g2">
        <div>
          <h3>Ce qui va se passer</h3>
          <p class="prose">Au début, taper avec dix doigts sera <b>plus lent</b> que ta méthode actuelle. Ce n'est pas un échec, c'est le signe que ton cerveau construit une nouvelle carte. Après quelques semaines, les deux courbes se croisent, puis tu la dépasses.</p>
          <h3>Astuces pour casser l'habitude</h3>
          <ul class="ticks">
            <li>Couvre tes mains avec un torchon ou une feuille pendant les exercices : tu ne peux plus regarder.</li>
            <li>Garde le clavier à portée de main, pas sur les genoux : la position doit être stable.</li>
            <li>Si tu te surprends à repartir sur tes index, arrête-toi, reviens à F et J, puis recommence.</li>
            <li>Ne triche pas pendant les exercices : un exercice fait à deux index renforce l'ancienne habitude.</li>
            <li>Dans la vie courante, tape comme avant au début. Change progressivement quand la rangée du haut est acquise.</li>
          </ul>
        </div>
        <div>
          <h3>Un plan réaliste</h3>
          <div class="plan">
            ${plan.map(p => `<div class="plan-row"><div class="pl-w"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div><div class="pl-d"><span class="pill">${esc(p[2])}</span><p>${esc(p[3])}</p></div></div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="band" id="g-chauffe">
      <h2>Échauffer les mains</h2>
      <div class="grid g3 tiles">
        <div class="tile"><h3>Le poing et l'étoile</h3><p>Ferme les poings, puis ouvre grand les doigts, comme une étoile. Dix fois, doucement.</p></div>
        <div class="tile"><h3>Les poignets</h3><p>Bras tendus devant toi, fais des cercles lents avec les poignets, dans les deux sens.</p></div>
        <div class="tile"><h3>Le piano</h3><p>Pose les mains à plat sur la table, puis soulève les doigts un par un, comme si tu jouais d'un piano muet.</p></div>
      </div>
    </section>

    <section class="band" id="g-faq">
      <h2>Questions fréquentes</h2>
      <div class="faq">
        ${faq.map(q => `<details><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}
      </div>
      <div class="cta-row"><button class="btn primary" type="button" data-go="cours">Commencer les leçons</button></div>
    </section>`;
  },
  mount(root) {
    const id = layoutId();
    const L = LAYOUTS[id];
    // position de départ : mettre en avant la rangée de base
    const kh = Keyboard($('#kbHome .kb', root));
    kh.setFocus(LAYOUT_DEFS[id].home);
    // carte des doigts : clic sur une touche
    const km = $('#kbMap .kb', root);
    km.addEventListener('click', e => {
      const k = e.target.closest('.key[data-k]');
      if (!k) return;
      const ch = k.dataset.k;
      const box = $('#keyInfo', root);
      if (ch.startsWith('__') || !L.map.has(ch)) { box.innerHTML = '<span class="muted">Cette touche n\'est pas une touche de caractère. Pour une majuscule, utilise la touche Maj du côté opposé.</span>'; return; }
      const i = L.map.get(ch);
      const f = FINGERS[i.f];
      const extra = LAYOUT_DEFS[id].rows[i.r] ? ROW_NAMES[i.r] : 'barre d\'espace';
      const s = LAYOUT_DEFS[id].rows[i.r] && LAYOUT_DEFS[id].rows[i.r].find(x => x[0] === ch);
      box.innerHTML = `<span class="kc f-${i.f}"><kbd>${esc(keyLabel(ch))}</kbd></span> <b>${esc(f.n)}</b> <span class="muted">· ${esc(extra)}${s && s[1] && !isLetter(ch) ? ' · avec Maj : ' + esc(s[1]) : ''}</span>`;
    });
    // décortiquer un mot
    const inp = $('#wordIn', root), chain = $('#chain', root), sum = $('#chainSum', root);
    const draw = () => {
      const w = normalizeText(inp.value || '');
      let h = '', alt = 0, pairs = 0, prevHand = null;
      for (const ch of w) {
        const i = L.map.get(ch);
        if (ch === ' ') { h += '<span class="ch sp"><b>␣</b><i>pouce</i></span>'; prevHand = null; continue; }
        if (!i) { h += `<span class="ch"><b>${esc(ch)}</b><i>?</i></span>`; continue; }
        const hand = FINGERS[i.f].hand;
        if (prevHand) { pairs++; if (hand !== prevHand) alt++; }
        prevHand = hand;
        h += `<span class="ch f-${i.f}"><b>${esc(ch)}</b><i>${esc(FINGERS[i.f].s)}</i>${i.shift ? '<u>Maj</u>' : ''}</span>`;
      }
      chain.innerHTML = h || '<span class="muted">Écris quelque chose…</span>';
      sum.textContent = pairs ? `${alt} changement${alt > 1 ? 's' : ''} de main sur ${pairs} enchaînement${pairs > 1 ? 's' : ''}. Plus les mains alternent, plus le mot est fluide.` : '';
    };
    inp.addEventListener('input', draw);
    draw();
  },
};

/* ============================================================
   PARCOURS (liste des leçons)
   ============================================================ */
PAGES.cours = {
  html() {
    const id = layoutId();
    const ls = lessonsFor(id);
    const nx = nextLesson(id);
    const prog = courseProgress(id);
    let n = 0;
    const modules = MODULES.map(m => {
      const lsm = ls.filter(l => l.m === m.id);
      if (!lsm.length) return '';
      const cards = lsm.map(l => {
        n = ls.indexOf(l) + 1;
        const st = lessonState(l, id);
        const keys = keysOf(l, id);
        const status = st.complete ? 'done' : (st.done > 0 ? 'part' : (nx && nx.id === l.id ? 'next' : 'todo'));
        return `<button class="lesson-card ${status}" type="button" data-go="lecon:${l.id}">
          <span class="lc-n">${n}</span>
          <span class="lc-main">
            <span class="lc-title">${esc(lessonTitle(l, id))}</span>
            <span class="lc-short">${esc(l.short || '')}</span>
            ${keys ? `<span class="lc-keys">${keycapsHTML(keys.length > 12 ? keys.slice(0, 12) : keys, id)}</span>` : ''}
          </span>
          <span class="lc-side">${starsHTML(st.total ? Math.round(3 * st.stars / st.max) : 0)}<span class="small muted">${st.done} / ${st.total}</span></span>
        </button>`;
      }).join('');
      return `<section class="module" aria-labelledby="m-${m.id}">
        <div class="module-head"><h2 id="m-${m.id}">${esc(m.title)}</h2><span class="pill">${esc(m.time)}</span></div>
        <p class="muted">${esc(m.blurb)}</p>
        <div class="lesson-list">${cards}</div>
      </section>`;
    }).join('');
    return `
    <header class="page-head">
      <p class="kicker">Le parcours</p>
      <h1>${ls.length} leçons, dans l'ordre</h1>
      <p class="lead">Chaque leçon explique le geste, puis propose des exercices dont le texte change à chaque fois. Tu valides un exercice avec ${settings().passAcc} % de précision ou plus. L'ordre est conseillé, mais rien n'est verrouillé.</p>
      <div class="cta">
        ${nx ? `<button class="btn primary lg" type="button" data-go="lecon:${nx.id}">${prog.done ? 'Continuer' : 'Commencer'} : ${esc(lessonTitle(nx, id))}</button>` : ''}
        <span class="muted">${prog.done} leçons terminées sur ${prog.total}</span>
      </div>
    </header>
    ${modules}`;
  },
};

/* ============================================================
   LEÇON
   ============================================================ */
PAGES.lecon = {
  html(param) {
    const id = layoutId();
    const ls = lessonsFor(id);
    const lesson = ls.find(l => l.id === param) || ls[0];
    const L = LAYOUTS[id];
    const idx = ls.indexOf(lesson);
    const keys = keysOf(lesson, id);
    const stages = stagesOf(lesson, id);
    const st = lessonState(lesson, id);
    const mod = MODULES.find(m => m.id === lesson.m);
    const prev = ls[idx - 1], nxt = ls[idx + 1];
    const body = k => fillKeys(tx(lesson[k], id) || '', keys);
    // doigt par doigt
    const fingerRows = [...keys].filter(ch => L.map.has(ch)).map(ch => {
      const i = L.map.get(ch);
      const rowName = i.dead ? 'après la touche ^' : ROW_NAMES[i.r];
      const sh = i.shift ? ` · avec <kbd>Maj</kbd> (${FINGERS[shiftFingerFor(i)].n.toLowerCase()})` : '';
      return `<li><span class="kc f-${i.f}"><kbd>${esc(keyLabel(ch))}</kbd></span><span><b>${esc(FINGERS[i.f].n)}</b> <span class="muted">${esc(rowName)}${sh}</span></span></li>`;
    }).join('');
    // exemples de mots
    const c = ctxForLesson(lesson, id);
    let pool = wordPool(c, { must: c.newPlain.length ? c.newPlain : (c.newKeys.length ? c.newKeys : []) });
    if (pool.length < 6) pool = wordPool(c);
    const examples = shuffle(pool.filter(w => w.length >= 2)).slice(0, 14);
    const exHTML = examples.length
      ? `<ul class="word-chips">${examples.map(w => `<li>${esc(w)}</li>`).join('')}</ul>`
      : '<p class="muted">Pas encore de vrais mots avec ces touches : les premiers exercices utilisent des séries de lettres.</p>';

    const stageRows = stages.map(s => {
      const r = stageRec(lesson.id, s.i);
      return `<li class="stage${r && r.stars ? ' done' : ''}">
        <span class="sg-n">${s.i + 1}</span>
        <span class="sg-main"><b>${esc(s.name)}</b><span class="muted">${esc(s.d || '')}</span></span>
        <span class="sg-meta">${r ? `${starsHTML(r.stars)}<span class="small muted">${r.acc} % · ${r.wpm} mpm</span>` : `<span class="small muted">objectif : ${s.goalAcc} %</span>`}</span>
        <button class="btn sm ${r && r.stars ? '' : 'primary'}" type="button" data-run="lesson:${lesson.id}:${s.i}">${r ? 'Refaire' : 'Lancer'}</button>
      </li>`;
    }).join('');

    return `
    <nav class="crumbs" aria-label="Fil d'Ariane"><button class="link" type="button" data-go="cours">Parcours</button><span>›</span><span>${esc(mod ? mod.title : '')}</span></nav>
    <header class="lesson-head">
      <p class="kicker">Leçon ${idx + 1} sur ${ls.length}</p>
      <h1>${esc(lessonTitle(lesson, id))}</h1>
      ${keys ? `<div class="lh-keys">${keycapsHTML(keys.length > 14 ? keys.slice(0, 14) : keys, id)}</div>` : ''}
    </header>

    <div class="lesson-grid">
      <div class="lesson-text">
        <section class="block"><h2>Ce qu'on apprend</h2><p>${body('intro')}</p></section>
        <section class="block"><h2>Le geste</h2><p>${body('gesture')}</p></section>
        <section class="block warn"><h2>L'erreur à éviter</h2><p>${body('mistake')}</p></section>
        ${lesson.tip ? `<section class="block tip"><h2>Un conseil</h2><p>${body('tip')}</p></section>` : ''}
        ${fingerRows ? `<section class="block"><h2>Doigt par doigt</h2><ul class="finger-list">${fingerRows}</ul></section>` : ''}
        <section class="block"><h2>Des mots pour te faire une idée</h2>${exHTML}</section>
      </div>
      <aside class="lesson-side">
        <div class="panel kb-wrap" id="kbLesson">${kbHTML(id)}<p class="small muted">${keys ? 'Les touches en couleur sont les nouvelles.' : 'Toutes les touches déjà vues sont utilisées.'}</p></div>
        <div class="panel">
          <div class="panel-head"><h2>Les exercices</h2><span class="small muted">${st.done} / ${st.total}</span></div>
          <ol class="stages">${stageRows}</ol>
          <p class="small muted">Un exercice est validé à partir de ${settings().passAcc} % de précision. Le texte est différent à chaque essai.</p>
        </div>
      </aside>
    </div>

    <div class="pager">
      ${prev ? `<button class="btn ghost" type="button" data-go="lecon:${prev.id}">← ${esc(lessonTitle(prev, id))}</button>` : '<span></span>'}
      ${nxt ? `<button class="btn ghost" type="button" data-go="lecon:${nxt.id}">${esc(lessonTitle(nxt, id))} →</button>` : '<span></span>'}
    </div>`;
  },
  mount(root, param) {
    const id = layoutId();
    const lesson = lessonsFor(id).find(l => l.id === param) || lessonsFor(id)[0];
    const kb = Keyboard($('#kbLesson .kb', root));
    kb.setFocus(keysOf(lesson, id));
  },
};

/* ============================================================
   EXÉCUTION d'un exercice (leçon, entraînement libre, test)
   ============================================================ */
function startRun(cfg) { App.run = cfg; go('run'); }

function resultHTML(res, o = {}) {
  const missList = Object.entries(res.miss || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const verdict = o.verdict || '';
  return `
  <div class="result" role="region" aria-label="Résultat">
    <div class="result-head">
      <p class="kicker">${esc(o.kicker || 'Résultat')}</p>
      <h2>${esc(o.title || 'Exercice terminé')}</h2>
      ${o.stars != null ? starsHTML(o.stars) : ''}
      ${verdict ? `<p class="verdict ${o.pass ? 'ok' : 'ko'}">${verdict}</p>` : ''}
    </div>
    <div class="grid g4 big-stats">
      <div class="panel"><span class="bs-v">${res.wpm}</span><span class="bs-l">mots / min</span>${o.level ? `<span class="small muted">${esc(o.level)}</span>` : ''}</div>
      <div class="panel"><span class="bs-v">${res.acc % 1 === 0 ? res.acc : res.acc.toFixed(1)}<small>%</small></span><span class="bs-l">précision</span>${o.goal ? `<span class="small muted">objectif ${o.goal} %</span>` : ''}</div>
      <div class="panel"><span class="bs-v">${fmtTime(res.secs)}</span><span class="bs-l">durée</span><span class="small muted">${res.hits} caractères</span></div>
      <div class="panel"><span class="bs-v">${res.errs}</span><span class="bs-l">erreur${res.errs > 1 ? 's' : ''}</span></div>
    </div>
    ${missList.length ? `<div class="panel"><h3>Touches à travailler</h3><div class="miss-list">${missList.map(([ch, n]) => `<span class="miss">${keycapsHTML(ch)}<b>${n}</b></span>`).join('')}</div></div>` : '<p class="muted">Aucune erreur sur cette série.</p>'}
    ${o.extra || ''}
    <div class="cta result-actions">${o.actions || ''}</div>
    <p class="small muted">Entrée : ${esc(o.enterLabel || 'continuer')} · Tab : refaire</p>
  </div>`;
}

PAGES.run = {
  html() { return '<div id="runRoot"></div>'; },
  mount(root) {
    const r = App.run;
    const rootEl = $('#runRoot', root);
    if (!r) { go('home'); return; }
    const id = layoutId();
    let ctl = null, off = null;
    const clearEnter = () => { if (off) { off(); off = null; } };
    App.cleanup = () => { clearEnter(); if (ctl) ctl.destroy(); };
    // Entrée = action principale, Tab = refaire, depuis le clavier
    const bindEnter = (fn, again) => {
      clearEnter();
      const t0 = performance.now();
      const h = e => {
        if ((e.key !== 'Enter' && e.key !== 'Tab') || performance.now() - t0 < 700) return;
        e.preventDefault();
        if (e.repeat) return;
        const f = e.key === 'Tab' ? (again || fn) : fn;
        clearEnter(); f();
      };
      window.addEventListener('keydown', h, true);
      off = () => window.removeEventListener('keydown', h, true);
    };

    /* ---- Leçon ---- */
    if (r.kind === 'lesson') {
      const ls = lessonsFor(id);
      const lesson = ls.find(l => l.id === r.lessonId);
      if (!lesson) { go('cours'); return; }
      const stages = stagesOf(lesson, id);
      const stage = stages[r.stage];
      const keys = keysOf(lesson, id);
      const launch = () => {
        clearEnter(); if (ctl) ctl.destroy();
        ctl = mountSession(rootEl, {
          kicker: `Leçon ${ls.indexOf(lesson) + 1} · exercice ${r.stage + 1} sur ${stages.length}`,
          title: stage.name, sub: stage.d,
          text: genStage(stage, lesson, id),
          focusKeys: keys,
          layoutId: id,
          onRestart: launch,
          onExit: () => go('lecon', lesson.id),
          onFinish: res => {
            const pass = res.acc >= stage.goalAcc;
            const stars = starsFor(res.acc, stage.goalAcc);
            const rec = Store.d.lessons[lesson.id] || (Store.d.lessons[lesson.id] = { stages: {} });
            const prev = rec.stages[stage.i];
            if (stars > 0 && (!prev || stars > prev.stars || (stars === prev.stars && res.acc > prev.acc))) rec.stages[stage.i] = { stars, acc: res.acc, wpm: res.wpm };
            logSession({ t: Date.now(), mode: 'lesson', ref: lesson.id + ':' + stage.i, wpm: res.wpm, acc: res.acc, secs: res.secs, chars: res.hits, errs: res.errs });
            const lastStage = stage.i >= stages.length - 1;
            const nextL = ls[ls.indexOf(lesson) + 1];
            let actions = '', enterFn, enterLabel;
            if (pass && !lastStage) {
              actions = `<button class="btn primary lg" type="button" id="aNext">Exercice suivant</button>`;
              enterFn = () => startRun({ kind: 'lesson', lessonId: lesson.id, stage: stage.i + 1 }); enterLabel = 'exercice suivant';
            } else if (pass && lastStage) {
              actions = nextL ? `<button class="btn primary lg" type="button" id="aNext">Leçon suivante : ${esc(lessonTitle(nextL, id))}</button>` : `<button class="btn primary lg" type="button" id="aNext">Retour au parcours</button>`;
              enterFn = () => nextL ? go('lecon', nextL.id) : go('cours'); enterLabel = nextL ? 'leçon suivante' : 'retour au parcours';
            } else {
              actions = `<button class="btn primary lg" type="button" id="aNext">Réessayer</button>`;
              enterFn = launch; enterLabel = 'réessayer';
            }
            actions += ` <button class="btn" type="button" id="aAgain">${pass ? 'Refaire' : 'Un autre texte'}</button> <button class="btn ghost" type="button" id="aBack">Retour à la leçon</button>`;
            const verdict = pass
              ? (stars === 3 ? 'Parfait. Ce geste est installé.' : 'Validé. Continue, la vitesse viendra.')
              : `Précision de ${res.acc} % : l'objectif est ${stage.goalAcc} %. Ralentis, regarde la touche à venir sur le clavier, et recommence.`;
            rootEl.innerHTML = resultHTML(res, {
              kicker: `Leçon ${ls.indexOf(lesson) + 1} · ${stage.name}`, title: pass ? 'Exercice validé' : 'Pas encore validé',
              stars, pass, verdict, goal: stage.goalAcc, actions, enterLabel,
            });
            $('#aNext', rootEl).addEventListener('click', enterFn);
            $('#aAgain', rootEl).addEventListener('click', launch);
            $('#aBack', rootEl).addEventListener('click', () => go('lecon', lesson.id));
            bindEnter(enterFn, launch);
          },
        });
      };
      launch();
      return;
    }

    /* ---- Entraînement libre / test ---- */
    const launchFree = () => {
      clearEnter(); if (ctl) ctl.destroy();
      const text = r.make();
      ctl = mountSession(rootEl, {
        kicker: r.kicker, title: r.title, sub: r.sub, text,
        timeLimit: r.timeLimit || null,
        extend: r.timeLimit ? () => r.more() : null,
        rhythm: r.rhythm || null,
        focusKeys: r.focusKeys || '',
        layoutId: id,
        onRestart: launchFree,
        onExit: () => go(r.back || 'pratique'),
        onFinish: res => {
          const prevRank = r.kind === 'test' ? currentRank() : null;
          logSession({ t: Date.now(), mode: r.kind, ref: r.ref || '', wpm: res.wpm, acc: res.acc, secs: res.secs, chars: res.hits, errs: res.errs });
          const base = Store.d.baseline;
          let extra = '', levelName = '';
          if (r.kind === 'test') {
            const first = Store.d.history.filter(h => h.mode === 'test').length === 1;
            const rk = rankFor(res.wpm, res.acc), idx = rankIndex(res.wpm, res.acc);
            levelName = rk.name;
            const counted = res.secs >= 25;
            let line = first ? 'C\'est ton point de départ. Refais ce test dans une semaine pour mesurer tes progrès.'
              : (base ? 'Départ : ' + base.wpm + ' mpm. Record : ' + Store.d.best.test + ' mpm.' : '');
            if (counted && prevRank && idx > prevRank.idx) line = 'Nouveau rang ! Tu étais ' + prevRank.r.name + '. ' + line;
            if (!counted) line = 'Test trop court pour compter dans ton rang (25 secondes minimum). ' + line;
            extra = `<div class="panel level-box">${medalHTML(rk)}<div><span class="kicker">Rang de ce test</span><b>${esc(rk.name)}</b><p class="muted">${esc(line)}</p><p class="small muted">${esc(nextRankHint(res.wpm, res.acc, idx))}</p></div></div>`;
          }
          const actions = `<button class="btn primary lg" type="button" id="aNext">Rejouer</button> <button class="btn" type="button" id="aBack">Changer de réglage</button> <button class="btn ghost" type="button" id="aStats">Mes statistiques</button>`;
          rootEl.innerHTML = resultHTML(res, { kicker: r.kicker, title: 'Terminé', level: levelName, extra, actions, enterLabel: 'rejouer' });
          $('#aNext', rootEl).addEventListener('click', launchFree);
          $('#aBack', rootEl).addEventListener('click', () => go(r.back || 'pratique'));
          $('#aStats', rootEl).addEventListener('click', () => go('stats'));
          bindEnter(launchFree);
        },
      });
    };
    launchFree();
  },
};
