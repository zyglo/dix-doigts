/* ============================================================
   Claviers, doigts, modules et leçons
   ============================================================ */
'use strict';

const FINGERS = {
  lp: { n: 'Auriculaire gauche', s: 'Auric. G', hand: 'L' },
  lr: { n: 'Annulaire gauche',   s: 'Annul. G', hand: 'L' },
  lm: { n: 'Majeur gauche',      s: 'Majeur G', hand: 'L' },
  li: { n: 'Index gauche',       s: 'Index G',  hand: 'L' },
  th: { n: 'Pouce',              s: 'Pouce',    hand: 'T' },
  ri: { n: 'Index droit',        s: 'Index D',  hand: 'R' },
  rm: { n: 'Majeur droit',       s: 'Majeur D', hand: 'R' },
  rr: { n: 'Annulaire droit',    s: 'Annul. D', hand: 'R' },
  rp: { n: 'Auriculaire droit',  s: 'Auric. D', hand: 'R' },
};
const FINGER_ORDER = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];
const ROW_NAMES = ['rangée des chiffres', 'rangée du haut', 'rangée de base', 'rangée du bas'];

/* Chaque touche : [caractère normal, caractère avec Maj, doigt].
   `family` regroupe les dispositions qui partagent les mêmes lettres et accents
   (le français et le belge sont des AZERTY : seule une partie de la ponctuation
   change de place). Les tables ont été comparées une à une avec celles de Windows. */
const ISO_MODS = [
  { post: ['Retour', 2] },
  { pre: ['Tab', 1.5], post: ['', 1.5] },
  { pre: ['Verr Maj', 1.75], post: ['Entrée', 1.25] },
  { pre: ['Maj', 1.25], post: ['Maj', 2.75] },
];
const LAYOUT_DEFS = {
  azerty: {
    id: 'azerty',
    family: 'azerty',
    name: 'AZERTY (français)',
    hint: 'France : la touche 8 donne « _ »',
    rows: [
      [['²','','lp'],['&','1','lp'],['é','2','lr'],['"','3','lm'],["'",'4','li'],['(','5','li'],['-','6','ri'],['è','7','ri'],['_','8','rm'],['ç','9','rr'],['à','0','rp'],[')','°','rp'],['=','+','rp']],
      [['a','A','lp'],['z','Z','lr'],['e','E','lm'],['r','R','li'],['t','T','li'],['y','Y','ri'],['u','U','ri'],['i','I','rm'],['o','O','rr'],['p','P','rp'],['^','¨','rp'],['$','£','rp']],
      [['q','Q','lp'],['s','S','lr'],['d','D','lm'],['f','F','li'],['g','G','li'],['h','H','ri'],['j','J','ri'],['k','K','rm'],['l','L','rr'],['m','M','rp'],['ù','%','rp'],['*','µ','rp']],
      [['<','>','lp'],['w','W','lp'],['x','X','lr'],['c','C','lm'],['v','V','li'],['b','B','li'],['n','N','ri'],[',','?','ri'],[';','.','rm'],[':','/','rr'],['!','§','rp']],
    ],
    mods: ISO_MODS,
    home: 'qsdfjklm',
    homeLeft: 'qsdf', homeRight: 'jklm',
    bumps: 'fj',
  },
  /* « Belge (virgule) », « Belge (point) » et « Belge français » de Windows ont la
     même table sur le clavier principal. Par rapport au français : § sur la touche 6,
     ! sur la touche 8, le tiret et le tiret du bas en bout de rangée des chiffres,
     = et + sur la dernière touche du bas, * avec Maj sur $, µ et £ à côté de ù. */
  be: {
    id: 'be',
    family: 'azerty',
    name: 'AZERTY (belge)',
    hint: 'Belgique (« Belge virgule » ou « Belge point ») et la plupart des Mac en français : la touche 8 donne « ! »',
    rows: [
      [['²','³','lp'],['&','1','lp'],['é','2','lr'],['"','3','lm'],["'",'4','li'],['(','5','li'],['§','6','ri'],['è','7','ri'],['!','8','rm'],['ç','9','rr'],['à','0','rp'],[')','°','rp'],['-','_','rp']],
      [['a','A','lp'],['z','Z','lr'],['e','E','lm'],['r','R','li'],['t','T','li'],['y','Y','ri'],['u','U','ri'],['i','I','rm'],['o','O','rr'],['p','P','rp'],['^','¨','rp'],['$','*','rp']],
      [['q','Q','lp'],['s','S','lr'],['d','D','lm'],['f','F','li'],['g','G','li'],['h','H','ri'],['j','J','ri'],['k','K','rm'],['l','L','rr'],['m','M','rp'],['ù','%','rp'],['µ','£','rp']],
      [['<','>','lp'],['w','W','lp'],['x','X','lr'],['c','C','lm'],['v','V','li'],['b','B','li'],['n','N','ri'],[',','?','ri'],[';','.','rm'],[':','/','rr'],['=','+','rp']],
    ],
    mods: ISO_MODS,
    home: 'qsdfjklm',
    homeLeft: 'qsdf', homeRight: 'jklm',
    bumps: 'fj',
  },
  qwerty: {
    id: 'qwerty',
    family: 'qwerty',
    name: 'QWERTY (US)',
    hint: 'Claviers américains : la touche 8 donne « 8 »',
    rows: [
      [['`','~','lp'],['1','!','lp'],['2','@','lr'],['3','#','lm'],['4','$','li'],['5','%','li'],['6','^','ri'],['7','&','ri'],['8','*','rm'],['9','(','rr'],['0',')','rp'],['-','_','rp'],['=','+','rp']],
      [['q','Q','lp'],['w','W','lr'],['e','E','lm'],['r','R','li'],['t','T','li'],['y','Y','ri'],['u','U','ri'],['i','I','rm'],['o','O','rr'],['p','P','rp'],['[','{','rp'],[']','}','rp']],
      [['a','A','lp'],['s','S','lr'],['d','D','lm'],['f','F','li'],['g','G','li'],['h','H','ri'],['j','J','ri'],['k','K','rm'],['l','L','rr'],[';',':','rp'],["'",'"','rp']],
      [['z','Z','lp'],['x','X','lr'],['c','C','lm'],['v','V','li'],['b','B','li'],['n','N','ri'],['m','M','ri'],[',','<','rm'],['.','>','rr'],['/','?','rp']],
    ],
    mods: [
      { post: ['Retour', 2] },
      { pre: ['Tab', 1.5], post: ['\\', 1.5] },
      { pre: ['Verr Maj', 1.75], post: ['Entrée', 2.25] },
      { pre: ['Maj', 2.25], post: ['Maj', 2.75] },
    ],
    home: 'asdfjkl;',
    homeLeft: 'asdf', homeRight: 'jkl;',
    bumps: 'fj',
  },
};

const MODULES = [
  { id: 'A', title: 'La rangée de base', time: '3 à 5 jours',
    blurb: 'Tes doigts apprennent leur position de départ. On ne cherche aucune vitesse, seulement le bon geste.' },
  { id: 'B', title: 'La rangée du haut', time: '4 à 6 jours',
    blurb: 'Les doigts montent d\'une rangée et reviennent toujours à leur touche de base. De vrais mots apparaissent.' },
  { id: 'C', title: 'La rangée du bas', time: '3 à 4 jours',
    blurb: 'Les doigts descendent. À la fin, tu connais les vingt-six lettres.' },
  { id: 'D', title: 'Majuscules, ponctuation, accents', time: '4 à 6 jours',
    blurb: 'Tout ce qui fait un vrai texte français : Maj, point, apostrophe, é è à ç ù, ? ! : ;' },
  { id: 'E', title: 'Les chiffres', time: '2 à 3 jours',
    blurb: 'La rangée du haut, tout en haut. Des heures, des prix, des dates, des numéros.' },
  { id: 'F', title: 'Vitesse et fluidité', time: 'en continu',
    blurb: 'Plus de nouvelles touches : on assouplit les enchaînements et on installe un rythme régulier.' },
];

/* Dans les textes : {K1} {K2}… = les touches de la leçon, {KS} = toutes.
   Un champ peut être une chaîne ou { a, b, q } : AZERTY français, AZERTY belge
   (à défaut, on reprend a) et QWERTY. */
const LESSONS = [
  /* ---------- A : rangée de base ---------- */
  {
    id: 'l01', m: 'A', title: 'Les index : F et J', k: { a: 'fj', q: 'fj' }, type: 'keys',
    short: 'Les deux repères en relief',
    intro: 'Tout part de deux petits reliefs. Les touches {K1} et {K2} ont un repère sous le doigt : tu peux les sentir sans regarder. Pose ton index gauche sur {K1} et ton index droit sur {K2}. Ce sont tes points d\'ancrage.',
    gesture: 'Les autres doigts se posent sur la rangée, à côté de leur index. Les pouces flottent au-dessus de la barre d\'espace. Tu frappes avec le bout du doigt, légèrement, puis le doigt revient aussitôt à sa place.',
    mistake: 'Tu es tenté de baisser les yeux pour vérifier. Résiste : si tu perds la position, retrouve les deux reliefs avec tes index et repars. C\'est ce retour qui fabrique la mémoire du geste.',
    tip: 'Les premières minutes semblent presque ridicules avec seulement deux touches. C\'est voulu : le cerveau apprend plus vite sur peu de touches.',
  },
  {
    id: 'l02', m: 'A', title: 'Les majeurs : D et K', k: { a: 'dk', q: 'dk' }, type: 'keys',
    short: 'Les doigts les plus longs',
    intro: 'Le majeur gauche gère {K1}, le majeur droit gère {K2}. Ce sont les doigts les plus longs : ils tombent naturellement sur la rangée de base, juste à côté des index.',
    gesture: 'Quand un majeur frappe, les autres doigts de la main restent posés. Seul le doigt qui travaille bouge, et il revient tout de suite sur sa touche.',
    mistake: 'Toute la main se soulève pour taper une seule touche. Garde la main immobile, comme si elle était posée sur une table.',
  },
  {
    id: 'l03', m: 'A', title: 'Les annulaires : S et L', k: { a: 'sl', q: 'sl' }, type: 'keys',
    short: 'Le doigt le plus capricieux',
    intro: 'L\'annulaire est le doigt le moins indépendant de la main : il est normal qu\'il soit un peu maladroit au début. {K1} se tape avec l\'annulaire gauche, {K2} avec l\'annulaire droit.',
    gesture: 'Garde les doigts légèrement courbés, comme si tu tenais une petite balle. L\'annulaire frappe avec le bout, tout droit vers le bas.',
    mistake: 'Les doigts qui s\'aplatissent ou se tendent. Un doigt trop plat appuie sur deux touches à la fois.',
    tip: 'Si l\'annulaire ne suit pas, ralentis. Il progresse très vite avec la répétition lente.',
  },
  {
    id: 'l04', m: 'A', title: { a: 'Les auriculaires : Q et M', q: 'Les auriculaires : A et ;' }, k: { a: 'qm', q: 'a;' }, type: 'keys',
    short: 'Les petits doigts',
    intro: 'Les petits doigts gardent les touches {K1} et {K2}. Avec les deux auriculaires, la rangée de base est presque complète : huit doigts sont en place.',
    gesture: 'L\'auriculaire est court. Laisse la main se décaler légèrement vers l\'extérieur pour l\'aider, mais garde le poignet droit et les autres doigts posés.',
    mistake: 'Taper la touche avec l\'annulaire par facilité. Chaque touche a son doigt, même quand c\'est inconfortable.',
  },
  {
    id: 'l05', m: 'A', title: 'Les index en extension : G et H', k: { a: 'gh', q: 'gh' }, type: 'keys',
    short: 'Un pas vers le centre',
    intro: 'Chaque index a deux touches : celle sur laquelle il repose, et celle d\'à côté, vers le centre du clavier. {K1} est pour l\'index gauche, {K2} pour l\'index droit.',
    gesture: 'L\'index s\'étire de côté, frappe, puis revient immédiatement sur F ou J. Le poignet ne tourne pas.',
    mistake: 'Décaler toute la main vers le centre et ne plus retrouver F et J. Si ça arrive, cherche les reliefs avec les index et repars.',
  },
  {
    id: 'l06', m: 'A', title: 'Révision : la rangée de base', type: 'review',
    k: { a: 'qsdfghjklm', q: 'asdfghjkl;' },
    short: 'Toute la rangée mélangée',
    intro: 'Toute la rangée de base est en place. Cette révision mélange les touches : c\'est l\'occasion de vérifier que chaque doigt retrouve sa touche sans hésiter.',
    gesture: 'Entre deux frappes, les doigts reviennent toujours sur la rangée. Garde une cadence régulière, comme un métronome, plutôt que des accélérations.',
    mistake: 'Accélérer dès que ça devient facile. La régularité vaut mieux que quelques frappes très rapides suivies d\'erreurs.',
    tip: 'Avant de continuer, tu dois pouvoir taper la rangée sans regarder, même lentement.',
  },

  /* ---------- B : rangée du haut ---------- */
  {
    id: 'l07', m: 'B', title: 'Les majeurs en haut : E et I', k: { a: 'ei', q: 'ei' }, type: 'keys',
    short: 'Deux des lettres les plus fréquentes',
    intro: 'Première montée d\'une rangée. {K1} est juste au-dessus de D, {K2} juste au-dessus de K. Ce sont deux des lettres les plus fréquentes du français, et de vrais mots apparaissent à partir d\'ici.',
    gesture: 'Le majeur monte tout droit d\'une rangée, frappe, puis redescend sur sa touche de base. Les autres doigts ne bougent pas.',
    mistake: 'Faire tourner la main ou passer par une autre touche en chemin. Le trajet est vertical.',
    tip: 'Tape les premiers mots lentement : l\'objectif est la bonne trajectoire, pas la vitesse.',
  },
  {
    id: 'l08', m: 'B', title: 'Les index en haut : R et U', k: { a: 'ru', q: 'ru' }, type: 'keys',
    short: 'Au-dessus de F et de J',
    intro: '{K1} se trouve au-dessus de F, {K2} au-dessus de J : encore les index, qui remontent d\'une rangée.',
    gesture: 'Un trajet vertical, puis retour immédiat sur F ou J. Le même geste que pour E et I.',
    mistake: 'Choisir le mauvais doigt : R est pour l\'index gauche, U pour l\'index droit, pas pour les majeurs.',
  },
  {
    id: 'l09', m: 'B', title: 'Les index en extension : T et Y', k: { a: 'ty', q: 'ty' }, type: 'keys',
    short: 'Les deux touches du centre',
    intro: '{K1} et {K2} sont les deux touches du centre, en haut. Elles sont tapées par les index qui s\'étirent en diagonale : l\'index gauche pour {K1}, l\'index droit pour {K2}.',
    gesture: 'L\'index monte en diagonale vers le centre puis revient sur F ou J. Garde le poignet stable.',
    mistake: 'Taper T avec le majeur. T est dans la colonne de l\'index gauche, au même titre que G et B.',
  },
  {
    id: 'l10', m: 'B', title: { a: 'Les annulaires en haut : Z et O', q: 'Les annulaires en haut : W et O' }, k: { a: 'zo', q: 'wo' }, type: 'keys',
    short: 'Annulaires en altitude',
    intro: 'Les annulaires montent sur {K1} (gauche) et {K2} (droite). Comme sur la rangée de base, ce sont des doigts moins agiles : accorde-leur un peu de temps.',
    gesture: 'Le trajet est vertical depuis S ou L. Pense à garder les doigts courbés.',
    mistake: 'Le majeur « vole » la touche de l\'annulaire. Si ça arrive, ralentis et tape seulement avec l\'annulaire.',
  },
  {
    id: 'l11', m: 'B', title: { a: 'Les auriculaires en haut : A et P', q: 'Les auriculaires en haut : Q et P' }, k: { a: 'ap', q: 'qp' }, type: 'keys',
    short: 'Le coin du clavier',
    intro: 'Les auriculaires montent sur {K1} (gauche) et {K2} (droite). Ce sont les touches les plus à l\'extérieur de la rangée du haut.',
    gesture: 'Le petit doigt monte tout droit, le poignet reste calme. Si besoin, la main se décale très légèrement vers l\'extérieur, puis revient.',
    mistake: 'Soulever le poignet ou le coude pour atteindre la touche. Seul le petit doigt travaille.',
  },
  {
    id: 'l12', m: 'B', title: 'Révision : la rangée du haut', type: 'review',
    k: { a: 'azertyuiop', q: 'qwertyuiop' },
    short: 'Dix lettres en haut, vraiment mélangées',
    intro: 'Tu connais les deux rangées principales. Voici le moment de les faire travailler ensemble, avec des mots complets.',
    gesture: 'Chaque doigt monte, frappe, redescend. Le « retour à la base » doit devenir un réflexe : c\'est lui qui t\'évite de perdre ta position.',
    mistake: 'Ne plus remonter ou redescendre complètement et se mettre à « sauter » d\'une touche à l\'autre. Reviens à la base.',
  },

  /* ---------- C : rangée du bas ---------- */
  {
    id: 'l13', m: 'C', title: 'Les index en bas : V et N', k: { a: 'vn', q: 'vn' }, type: 'keys',
    short: 'Sous F et sous J',
    intro: 'Pour descendre, les index font un petit pas en arrière : {K1} est sous F, {K2} est sous J (légèrement décalé vers la gauche).',
    gesture: 'Le doigt se replie vers la paume pour atteindre la rangée du bas, frappe, puis remonte sur sa touche de base. Le poignet ne bouge pas.',
    mistake: 'Décoller la main entière pour descendre. Seul le doigt travaille.',
  },
  {
    id: 'l14', m: 'C', title: { a: 'Les index en extension : B et la virgule', q: 'Les index en extension : B et M' }, k: { a: 'b,', q: 'bm' }, type: 'keys',
    short: 'Les deux touches les plus éloignées',
    intro: {
      a: '{K1} est tapé par l\'index gauche (juste à côté de V). La virgule est tapée par l\'index droit, à côté de N. En AZERTY, la virgule est une vraie touche, sans Maj.',
      q: '{K1} est tapé par l\'index gauche (juste à côté de V). {K2} est tapé par l\'index droit, à côté de N.',
    },
    gesture: 'Ces deux touches sont les plus éloignées de leur doigt. Tends l\'index en diagonale vers le centre, puis ramène-le sur la touche de départ.',
    mistake: 'Utiliser le majeur pour la virgule parce que c\'est plus proche. Dès maintenant, prends le bon réflexe : l\'index droit.',
  },
  {
    id: 'l15', m: 'C', title: { a: 'Majeur, annulaire, auriculaire : C, X et W', q: 'Majeur, annulaire, auriculaire : C, X et Z' }, k: { a: 'cxw', q: 'cxz' }, type: 'keys',
    short: 'Les trois dernières lettres de gauche',
    intro: 'Le majeur gauche descend sur {K1}, l\'annulaire gauche sur {K2}, l\'auriculaire gauche sur {K3}. Ce sont les trois dernières lettres du côté gauche.',
    gesture: 'Même geste que pour les rangées précédentes : un trajet droit vers le bas depuis la touche de base, et retour.',
    mistake: 'Éviter ces lettres parce qu\'elles sont rares. Un mot comme « taxi » ou « wagon » casse ton rythme si le geste n\'est pas acquis.',
  },
  {
    id: 'l16', m: 'C', title: 'Révision : l\'alphabet complet', type: 'review',
    k: { a: '', q: '' },
    short: 'Les vingt-six lettres',
    intro: 'Les vingt-six lettres sont acquises. Cette série mélange tout l\'alphabet avec de vrais mots.',
    gesture: 'Concentre-toi sur la régularité : une frappe égale à la précédente, sans à-coup, avec les yeux sur l\'écran.',
    mistake: 'Regarder le clavier dès qu\'une lettre rare arrive (w, x, z, k). Si tu hésites, ralentis et cherche avec le bon doigt, sans baisser les yeux.',
    tip: 'Pour le moment, ne te préoccupe pas des accents ni des majuscules : c\'est la prochaine étape.',
  },

  /* ---------- D : majuscules, ponctuation, accents ---------- */
  {
    id: 'l17', m: 'D', title: 'Les majuscules', k: { a: '', q: '' }, type: 'custom', caps: true,
    short: 'La touche Maj, du côté opposé',
    intro: 'Pour une majuscule, tu maintiens Maj avec l\'auriculaire du côté opposé à la lettre, pendant que l\'autre main tape la lettre. Lettre à gauche (Q, S, D) : Maj droite. Lettre à droite (J, K, L) : Maj gauche.',
    gesture: 'Appuie sur Maj juste avant la lettre, relâche aussitôt après. Les deux mouvements se font presque en même temps, comme un petit « clic » à deux mains.',
    mistake: 'Toujours utiliser la même touche Maj : la main se contorsionne et tu perds ta position.',
    tip: 'Verr Maj sert seulement à écrire un mot entier en capitales. Pour une lettre, utilise Maj.',
    stages: [
      { name: 'Majuscules isolées', d: 'Une majuscule, puis des lettres', gen: 'capsLetters', n: 40 },
      { name: 'Prénoms', d: 'Une majuscule au début de chaque mot', gen: 'names', n: 60 },
      { name: 'Villes de France', d: 'Encore des majuscules, plus de lettres', gen: 'cities', n: 70 },
      { name: 'Début de phrase', d: 'Une majuscule à chaque phrase (le point vient à la leçon suivante)', gen: 'sentences', n: 110 },
      { name: 'Mélange', d: 'Noms, mots, phrases', gen: 'mixCaps', n: 120, goalAcc: 93 },
    ],
  },
  {
    id: 'l18', m: 'D', title: { a: 'Le point et l\'apostrophe', q: 'Le point, la virgule et l\'apostrophe' }, k: { a: ".'", q: ".,'" }, type: 'custom',
    short: 'Terminer et élider',
    intro: {
      a: 'Le point n\'est pas une touche directe en AZERTY : c\'est Maj + la touche ; (majeur droit). Maj se prend à gauche, avec l\'auriculaire gauche. L\'apostrophe est sur la touche 4, au-dessus de la rangée du haut (index gauche).',
      q: 'Le point est à côté de la virgule (annulaire droit). L\'apostrophe est à droite de la rangée de base (auriculaire droit). La virgule est à côté de M (majeur droit).',
    },
    gesture: {
      a: 'Pour le point : auriculaire gauche sur Maj, majeur droit sur ;. Pour l\'apostrophe : l\'index gauche monte de deux rangées et revient sur F.',
      q: 'Tous ces signes sont à portée directe de la rangée de base : le doigt part, frappe, revient.',
    },
    mistake: {
      a: 'Chercher le point sur la rangée du bas, sans Maj : tu tapes un point-virgule. Le point est bien Maj + ; en AZERTY.',
      q: 'Oublier de revenir sur la touche de base après l\'apostrophe : l\'auriculaire droit s\'éloigne vite.',
    },
    stages: [
      { name: 'Le point', d: 'Des mots terminés par un point', gen: 'punctWords', opts: { marks: ['.'] }, n: 50 },
      { name: 'L\'apostrophe', d: 'l\'eau, j\'ai, c\'est, d\'un…', gen: 'apos', n: 60 },
      { name: 'Point, virgule, apostrophe', d: 'Les trois ensemble', gen: 'punctWords', opts: { marks: ['.', ',', '\''] }, n: 80 },
      { name: 'Phrases', d: 'De vraies phrases', gen: 'sentences', n: 110 },
    ],
  },
  {
    id: 'l19', m: 'D', only: 'azerty', title: 'Les accents : é, è et à', k: { a: 'éèà', q: '' }, type: 'custom',
    short: 'Sur la rangée des chiffres',
    intro: 'Ces trois accents sont sur la rangée des chiffres, sans Maj. é est sur la touche 2 (annulaire gauche), è sur la touche 7 (index droit), à sur la touche 0 (auriculaire droit). Ce sont parmi les lettres les plus fréquentes du français.',
    gesture: 'L\'annulaire gauche monte de deux rangées pour é : c\'est un grand déplacement. Doigt tendu droit vers le haut, puis retour sur S. Pour è, l\'index droit monte en diagonale ; pour à, l\'auriculaire monte tout droit.',
    mistake: 'Taper e à la place de é : c\'est la faute la plus courante, car e est tout près. Vérifie que ton doigt est monté jusqu\'à la rangée des chiffres.',
    tip: 'Si é est lent, répète-le tout seul plusieurs fois, comme une gamme.',
    stages: [
      { name: 'é, è et à seuls', d: 'Entraîne le déplacement', gen: 'accentPat', n: 40 },
      { name: 'Mots avec é', d: 'été, café, idée, élève…', gen: 'accWords', opts: { keys: 'é' }, n: 60 },
      { name: 'Mots avec è et à', d: 'père, très, déjà, voilà…', gen: 'accWords', opts: { keys: 'èà' }, n: 60 },
      { name: 'Mélange', d: 'Tous les accents de la leçon', gen: 'accWords', n: 80 },
      { name: 'Phrases', d: 'Dans un vrai texte', gen: 'sentencesWithNew', n: 110 },
    ],
  },
  {
    id: 'l20', m: 'D', only: 'azerty', title: 'ç, ù et les accents circonflexes', k: { a: 'çùâêîôû', q: '' }, type: 'custom',
    short: 'Cédille, ù, ^',
    intro: 'ç est sur la touche 9 (annulaire droit), ù est à droite du M (auriculaire droit). Pour les circonflexes (â, ê, î, ô, û), tu tapes d\'abord la touche ^ (à droite du P) puis la voyelle.',
    gesture: '^ est une touche « morte » : rien ne s\'affiche tant que tu n\'as pas tapé la voyelle suivante. L\'auriculaire droit tape ^, puis le doigt de la voyelle enchaîne tout de suite.',
    mistake: 'Taper ^ puis espace : l\'accent apparaît seul. Il faut enchaîner directement avec la voyelle.',
    stages: [
      { name: 'ç et ù', d: 'Les deux touches seules', gen: 'accentPat', opts: { keys: 'çù' }, n: 36 },
      { name: 'Mots avec ç ou ù', d: 'ça, garçon, leçon, où…', gen: 'accWords', opts: { keys: 'çù' }, n: 60 },
      { name: 'Les circonflexes', d: 'être, fête, forêt, côté…', gen: 'accWords', opts: { keys: 'âêîôû' }, n: 70 },
      { name: 'Tous les accents', d: 'é è à ç ù ê â î ô û', gen: 'accWords', opts: { keys: 'éèàçùâêîôû' }, n: 90, goalAcc: 93 },
      { name: 'Phrases', d: 'Dans un vrai texte', gen: 'sentencesWithNew', n: 110 },
    ],
  },
  {
    id: 'l21', m: 'D', title: 'Ponctuation : ? ! : ; -', k: { a: '?!:;-', q: '?!:;-' }, type: 'custom',
    short: 'Le reste de la ponctuation',
    intro: {
      a: 'Sur un AZERTY français, ? s\'obtient avec Maj + la virgule. Les touches !, : et ; sont sur la rangée du bas, sans Maj (auriculaire, annulaire et majeur droits). Le tiret - est sur la touche 6 (index droit).',
      b: 'Sur un AZERTY belge, ? s\'obtient avec Maj + la virgule, comme en France. Les touches : et ; sont sur la rangée du bas, sans Maj (annulaire et majeur droits). Deux signes sont ailleurs que sur un clavier français : ! est sur la touche 8 de la rangée des chiffres, sans Maj (majeur droit), et le tiret - est tout à droite de cette même rangée (auriculaire droit).',
      q: 'En QWERTY, ? s\'obtient avec Maj + /, ! avec Maj + 1 et : avec Maj + ;. Le point-virgule ; et le tiret - sont directs.',
    },
    gesture: {
      a: 'Ces signes sont presque tous tapés par la main droite : prépare l\'auriculaire et l\'annulaire avant la fin de la phrase. Garde le même tempo que pour les lettres.',
      b: 'Ces signes sont tous tapés par la main droite. Pour !, le majeur droit monte de deux rangées (touche 8, juste au-dessus de I), frappe, puis revient sur K. Pour le tiret, l\'auriculaire droit monte tout droit en bout de rangée. Garde le même tempo que pour les lettres.',
    },
    mistake: {
      a: 'Ralentir fortement à la ponctuation. Elle fait partie du rythme : une phrase n\'est pas terminée tant que son signe n\'est pas tapé.',
      b: 'Chercher ! sur la rangée du bas comme sur un clavier français : sur ton clavier belge, la dernière touche du bas donne = (avec Maj : +). Le point d\'exclamation est sur la touche 8, le tiret en bout de rangée des chiffres.',
    },
    stages: [
      { name: 'Le point d\'interrogation', d: 'Questions courtes', gen: 'puncts', opts: { marks: ['?'] }, n: 60 },
      { name: 'Point d\'exclamation et deux-points', d: 'Bravo! Attention: danger', gen: 'puncts', opts: { marks: ['!', ':'] }, n: 70 },
      { name: 'Point-virgule et tiret', d: 'Listes et mots composés', gen: 'puncts', opts: { marks: [';', '-'] }, n: 70 },
      { name: 'Tout mélangé', d: 'Tous les signes', gen: 'puncts', n: 110, goalAcc: 93 },
    ],
  },

  /* ---------- E : chiffres ---------- */
  {
    id: 'l22', m: 'E', title: 'Les chiffres 1 2 3 4 5', k: { a: '12345', q: '12345' }, type: 'custom',
    short: 'Main gauche, tout en haut',
    intro: {
      a: 'Sur AZERTY, les chiffres sont des majuscules de la rangée du haut : il faut maintenir Maj. Pour un chiffre de la main gauche, tu prends Maj droite (auriculaire droit).',
      q: 'Les chiffres sont sur la rangée du haut, sans Maj : même geste que pour une lettre, mais de deux rangées plus haut.',
    },
    gesture: '1 : auriculaire, 2 : annulaire, 3 : majeur, 4 et 5 : index (le 5 est l\'extension). Reviens toujours sur la rangée de base après chaque chiffre.',
    mistake: 'Laisser tout le bras monter. Seuls les doigts bougent.',
    stages: [
      { name: 'Chiffres seuls', d: '1 2 3 4 5 en groupes', gen: 'digPat', n: 40 },
      { name: 'Nombres', d: 'Séries de chiffres', gen: 'digNums', n: 60 },
      { name: 'Chiffres et mots', d: '3 chats, 12 pommes…', gen: 'digMix', n: 70 },
      { name: 'Défi', d: 'Précision avant tout', gen: 'digNums', n: 90, goalAcc: 93 },
    ],
  },
  {
    id: 'l23', m: 'E', title: 'Les chiffres 6 7 8 9 0', k: { a: '67890', q: '67890' }, type: 'custom',
    short: 'Main droite, tout en haut',
    intro: {
      a: 'Même principe que pour la main gauche : Maj + le chiffre. Pour la main droite, tu prends Maj gauche (auriculaire gauche).',
      q: 'Même geste que pour les chiffres de gauche, côté droit.',
    },
    gesture: '6 et 7 : index droit, 8 : majeur, 9 : annulaire, 0 : auriculaire. Garde les doigts courbés et reviens sur la rangée de base.',
    mistake: 'Regarder le clavier parce que le 0 est loin. Le 0 est tout simplement le dernier chiffre à droite, pour l\'auriculaire.',
    stages: [
      { name: 'Chiffres seuls', d: '6 7 8 9 0 en groupes', gen: 'digPat', n: 40 },
      { name: 'Nombres', d: 'Séries de chiffres', gen: 'digNums', n: 60 },
      { name: 'Chiffres et mots', d: '8 oiseaux, 20 minutes…', gen: 'digMix', n: 70 },
      { name: 'Les dix chiffres', d: 'Tout mélangé', gen: 'digNums', opts: { all: true }, n: 100, goalAcc: 93 },
    ],
  },
  {
    id: 'l24', m: 'E', title: 'Nombres, dates et heures', k: { a: '', q: '' }, type: 'custom',
    short: 'Les chiffres dans la vraie vie',
    intro: 'On mélange chiffres, virgules, deux-points et tirets comme dans la vraie vie : des heures (08:45), des prix (12,50), des dates (25-12-2026), des numéros de téléphone.',
    gesture: 'Lis par groupes de deux ou trois chiffres : ton cerveau mémorise plus vite par paquets que chiffre par chiffre.',
    mistake: 'Retomber dans les deux index pour les chiffres. Si ça arrive, ralentis et reprends la bonne main et le bon doigt.',
    stages: [
      { name: 'Heures', d: '08:45, 12:30…', gen: 'times', n: 50 },
      { name: 'Prix', d: '12,50 · 4,99 · 130,00', gen: 'prices', n: 50 },
      { name: 'Dates', d: '25-12-2026', gen: 'dates', n: 60 },
      { name: 'Téléphones', d: '06 12 34 56 78', gen: 'phones', n: 70 },
      { name: 'Tout mélangé', d: 'Texte et nombres', gen: 'numMix', n: 110, goalAcc: 93 },
    ],
  },

  /* ---------- F : vitesse et fluidité ---------- */
  {
    id: 'l25', m: 'F', title: 'Bigrammes fréquents', k: { a: '', q: '' }, type: 'custom',
    short: 'Les paires qui reviennent tout le temps',
    intro: 'Les mêmes paires de lettres reviennent sans cesse en français : es, en, re, er, on, nt, de… Les travailler à part, c\'est automatiser des mouvements entiers plutôt que des lettres isolées.',
    gesture: 'Tape chaque paire comme un seul geste fluide, pas comme deux frappes séparées.',
    mistake: 'Accélérer sur les paires faciles et trébucher sur les suivantes. Garde le même tempo.',
    stages: [
      { name: 'Paires', d: 'es en re er on nt…', gen: 'bigrams', n: 50 },
      { name: 'Trios', d: 'ent ion que les ous…', gen: 'trigrams', n: 60 },
      { name: 'Mots à paires', d: 'Des mots qui contiennent ces paires', gen: 'bigramWords', n: 80 },
      { name: 'Phrases', d: 'Retrouve-les dans le texte', gen: 'sentences', n: 110 },
    ],
  },
  {
    id: 'l26', m: 'F', title: 'Mots courts du quotidien', k: { a: '', q: '' }, type: 'custom',
    short: 'Les mots de trois à cinq lettres',
    intro: 'Les mots courts représentent l\'essentiel de ce qu\'on écrit : le, la, de, un, est, que, pour… Plus ils deviennent automatiques, plus ton débit global monte.',
    gesture: 'Un mot court doit sortir d\'un seul geste, comme une syllabe. L\'espace fait partie du mot : ton pouce part dès la dernière lettre.',
    mistake: 'Traîner sur l\'espace. Le pouce doit être prêt, pas en retard.',
    stages: [
      { name: 'Mots très courts', d: '2 à 3 lettres', gen: 'shortWords', opts: { max: 3 }, n: 60 },
      { name: 'Mots courts', d: 'jusqu\'à 5 lettres', gen: 'shortWords', opts: { max: 5 }, n: 90 },
      { name: 'En série', d: 'Un rythme régulier', gen: 'shortWords', opts: { max: 5 }, n: 120, goalAcc: 93 },
    ],
  },
  {
    id: 'l27', m: 'F', title: 'Mots longs', k: { a: '', q: '' }, type: 'custom',
    short: 'Sept lettres et plus',
    intro: 'Un mot long est un enchaînement : ce n\'est pas plus difficile, c\'est seulement plus long. L\'objectif est de garder le même tempo du début à la fin du mot.',
    gesture: 'Prépare la lettre suivante pendant que tu tapes la lettre courante. Ne fige pas la main au milieu du mot.',
    mistake: 'Ralentir au milieu du mot par peur de se tromper. Mieux vaut un tempo plus lent, mais constant.',
    stages: [
      { name: 'Mots de 7 à 9 lettres', d: 'Les mots longs courants', gen: 'longWords', opts: { min: 7, max: 9 }, n: 90 },
      { name: 'Mots de 10 lettres et plus', d: 'Les plus longs', gen: 'longWords', opts: { min: 10 }, n: 100 },
      { name: 'Long et court mélangés', d: 'Alterne les rythmes', gen: 'words', n: 140, goalAcc: 93 },
    ],
  },
  {
    id: 'l28', m: 'F', title: 'L\'alternance des mains', k: { a: '', q: '' }, type: 'custom',
    short: 'Le rythme le plus fluide',
    intro: 'Quand deux lettres consécutives sont tapées par des mains différentes, les doigts peuvent se préparer en avance : c\'est l\'enchaînement le plus fluide. Les mots qui alternent les mains sont parfaits pour sentir le rythme.',
    gesture: 'Pense au mouvement comme à un va-et-vient : gauche, droite, gauche, droite. Laisse la main qui attend se préparer.',
    mistake: 'Raidir les épaules pour aller plus vite. La vitesse vient du relâchement, pas de la tension.',
    stages: [
      { name: 'Mots alternés', d: 'Gauche, droite, gauche…', gen: 'altWords', n: 70 },
      { name: 'En série', d: 'Un rythme continu', gen: 'altWords', n: 110 },
      { name: 'Mélange', d: 'Avec des mots normaux', gen: 'words', n: 130, goalAcc: 93 },
    ],
  },
  {
    id: 'l29', m: 'F', title: 'Le même doigt, deux fois', k: { a: '', q: '' }, type: 'custom',
    short: 'Le point dur quand on vient des index',
    intro: 'Certains enchaînements demandent au même doigt de taper deux touches de suite (par exemple « un », « ce », « br »). C\'est souvent le point le plus difficile quand on vient des deux index : ton ancienne habitude fait bouger un seul doigt de toute façon.',
    gesture: 'Prépare le doigt à l\'avance : dès que la première touche est frappée, le doigt glisse déjà vers la suivante. Ne saute pas, glisse.',
    mistake: 'Utiliser l\'autre main ou un autre doigt « pour aller plus vite ». Garde le bon doigt, ralentis, puis reviens à la vitesse normale.',
    stages: [
      { name: 'Paires du même doigt', d: 'Mots courts', gen: 'sameFingerWords', opts: { max: 5 }, n: 60 },
      { name: 'Mots à doigt répété', d: 'Mots plus longs', gen: 'sameFingerWords', n: 90 },
      { name: 'En situation', d: 'Phrases entières', gen: 'sentences', n: 130, goalAcc: 93 },
    ],
  },
  {
    id: 'l30', m: 'F', title: 'Phrases complètes', k: { a: '', q: '' }, type: 'custom',
    short: 'Du texte, comme dans la vraie vie',
    intro: 'Tu as maintenant toutes les touches. Ces exercices sont de vraies phrases, avec majuscules, accents et ponctuation : c\'est ce que tu taperas tous les jours.',
    gesture: 'Garde le regard sur la ligne en cours, pas sur le mot que tu es en train de taper. Lire légèrement en avance donne de la fluidité.',
    mistake: 'Corriger chaque erreur en perdant le fil. Dans une phrase, l\'important est de continuer avec calme.',
    stages: [
      { name: 'Phrases courtes', d: 'Dix mots environ', gen: 'sentences', n: 90 },
      { name: 'Phrases moyennes', d: 'Plus de ponctuation', gen: 'sentences', n: 150 },
      { name: 'Enchaînement', d: 'Plusieurs phrases', gen: 'sentences', n: 220, goalAcc: 94 },
    ],
  },
  {
    id: 'l31', m: 'F', title: 'Textes entiers', k: { a: '', q: '' }, type: 'custom',
    short: 'Des paragraphes, sans pause',
    intro: 'Pour finir : des paragraphes entiers. C\'est l\'épreuve du rythme. Tu peux la répéter à volonté, un texte différent à chaque fois.',
    gesture: 'Respire. Garde un tempo régulier, les épaules basses, les poignets souples.',
    mistake: 'Partir trop vite dans la première phrase puis s\'effondrer. Pars légèrement en dessous de ta vitesse maximale.',
    stages: [
      { name: 'Paragraphe court', d: 'Environ trois lignes', gen: 'text', n: 250 },
      { name: 'Paragraphe complet', d: 'Un vrai paragraphe', gen: 'text', n: 350 },
      { name: 'Deux paragraphes', d: 'Endurance', gen: 'text2', n: 600, goalAcc: 94 },
    ],
  },
];
