/* ============================================================
   Corpus français : mots, phrases, textes
   Apostrophe droite ', pas de ligature œ ni de guillemets,
   pour que tout reste tapable sur un clavier AZERTY.
   ============================================================ */
'use strict';

const WORDS_RAW = `
si se le me de ne te je ce la il on un en et ou au du les des mes tes ses ces mon ton son ma ta sa
elle selle mise mille fille fils file fil lis lie dis dise gel sel ski glisse lisse midi lime fief gifle sigle
mais donc or ni car que qui quoi dont où cet cette notre votre leur nos vos leurs tu nous vous ils elles lui moi toi soi eux
pas plus jamais rien tout tous toute toutes très trop peu assez bien mal mieux moins aussi encore déjà toujours souvent parfois
alors puis ensuite avant après pendant depuis vers chez dans sur sous avec sans pour par contre entre comme quand lorsque
comment pourquoi combien ici là loin près oui non
être avoir faire dire aller voir savoir pouvoir falloir vouloir venir devoir prendre trouver donner parler aimer passer mettre
demander rester répondre entendre penser arriver connaître devenir sentir sembler tenir comprendre rendre attendre sortir vivre
écrire jouer lire courir manger boire dormir ouvrir fermer chercher regarder marcher porter apprendre partir changer finir choisir
réussir oublier écouter travailler chanter danser nager cuisiner acheter vendre payer garder laisser appeler montrer retrouver
commencer continuer terminer taper cliquer respirer reposer recommencer corriger progresser répéter
est sont était sera fait font dit vais va vont vois vu sais sait peux peut veux veut viens vient doit dois prend prends pris
mets donne donné trouve parle parlé aime aimé passe reste reviens tombe monte descend vole roule glisse
homme femme enfant garçon père mère frère ami amie famille maison ville rue route jardin arbre fleur chat chien oiseau poisson
cheval vache souris livre table chaise porte fenêtre chambre cuisine salon lit pain fromage beurre lait café thé eau vin pomme
poire fraise orange citron banane tomate légume fruit viande soupe gâteau tarte sucre poivre jour nuit matin soir semaine mois
année temps heure minute seconde lundi mardi mercredi jeudi vendredi samedi dimanche janvier février mars avril mai juin
juillet août septembre octobre novembre décembre printemps été automne hiver soleil lune étoile ciel nuage pluie neige vent
orage mer plage montagne forêt rivière lac pont champ terre monde pays école classe élève professeur travail bureau métier
voiture train avion vélo bateau gare station musique film photo image mot phrase lettre texte page clavier écran ordinateur
touche doigt main pied tête bras jambe corps vie mort amour paix guerre idée question réponse chose cause fois côté fin début
point ligne nom prénom nombre chiffre problème solution exemple exercice leçon test niveau vitesse erreur progrès
grand petit gros long court beau belle bon bonne mauvais jeune vieux nouveau nouvelle ancien premier dernier autre même seul
plein vide haut bas chaud froid doux dur lourd léger rapide lent fort faible facile difficile simple calme heureux triste
content fatigué prêt libre vrai faux propre sale clair sombre rouge bleu vert jaune noir blanc gris rose violet brun joli
drôle gentil utile possible important certain différent
bonjour merci salut bonsoir demain hier voilà
kilo kiwi taxi week wagon xylophone zèbre yaourt kayak koala zéro zoo gym lys style mythe tigre titre type stylo cycle
voyage royal payer crayon joyeux essayer yeux yoga web wifi watt boxe six deux heureux jaloux zone zèle douze onze treize
seize quinze vingt trente cent mille trois quatre cinq sept huit neuf dix
texte examen expert excellent extra exemple exact
poule canard lapin renard loup ours lion singe mouton chèvre cochon abeille papillon fourmi escargot grenouille tortue
dauphin requin baleine oiseau
chemise pantalon robe jupe manteau chapeau chaussure gant écharpe lunettes montre sac clé stylo crayon cahier gomme règle
papier ciseaux colle cadeau fête vacances
téléphone internet message courrier adresse fichier dossier bouton document programme logiciel réseau site lien recherche
rapidement lentement doucement simplement vraiment heureusement maintenant ensemble autour devant derrière dessus dessous
pourtant cependant environ presque longtemps tellement quelque quelques chaque chacun personne peuple regard histoire science
français anglais langue parole souvenir silence bruit lumière couleur chemin village campagne
bibliothèque université hôpital médecin dentiste extraordinaire indépendant développement environnement gouvernement
intéressant information communication organisation responsabilité automatiquement
queue quel quelle quitter question
`;

const SENTENCES_RAW = [
  "Elle lie le fil.",
  "Il lisse le fil.",
  "Le fil file.",
  "Tu aimes la musique.",
  "Julie aime la musique.",
  "Il y a du soleil.",
  "Elle joue de la guitare.",
  "Tu joues de la harpe.",
  "Elle est partie tout de suite.",
  "Le professeur est parti.",
  "Elle ramasse les feuilles.",
  "Tu pars tout de suite? Moi aussi.",
  "Le poulet est tout dur.",
  "Il fait beau aujourd'hui.",
  "Le chat dort sur le canapé.",
  "Petit à petit, l'oiseau fait son nid.",
  "Qui ne risque rien n'a rien.",
  "La nuit porte conseil.",
  "Pierre qui roule n'amasse pas mousse.",
  "Chaque jour, je m'entraîne un peu plus.",
  "Mes doigts glissent sur les touches sans effort.",
  "Respire, détends tes épaules et recommence.",
  "Le vent se lève, la mer est calme.",
  "Nous partons demain matin pour la montagne.",
  "Elle lit un livre dans le jardin.",
  "Il pleut depuis ce matin sur toute la ville.",
  "Peux-tu fermer la fenêtre, s'il te plaît?",
  "Où est mon stylo rouge?",
  "Le train de huit heures quarante arrive à quai.",
  "Un bon repas se partage en famille.",
  "Les enfants jouent dans la cour de l'école.",
  "Chaque lettre trouve sa place sans que je regarde.",
  "L'erreur fait partie de l'apprentissage.",
  "Prends ton temps, la vitesse viendra toute seule.",
  "Le soleil se couche derrière les collines.",
  "Je boirais volontiers un café bien chaud.",
  "Mon voisin répare son vélo dans le garage.",
  "Cet hiver, il a neigé pendant trois jours.",
  "Les fleurs du jardin sentent très bon.",
  "Nous avons mangé des pommes et des poires.",
  "La boulangerie ouvre à sept heures.",
  "Il faut deux minutes pour préparer le thé.",
  "Marie range ses livres sur l'étagère.",
  "Le facteur passe tous les matins vers dix heures.",
  "Mon ordinateur démarre un peu lentement.",
  "Ce film m'a vraiment fait rire.",
  "Un petit pas chaque jour mène très loin.",
  "Les nuages gris annoncent un orage.",
  "Elle chante en cuisinant le dîner.",
  "Le chien court après la balle.",
  "Je range mes affaires avant de partir.",
  "Cette route traverse une grande forêt.",
  "On apprend à marcher en tombant.",
  "Rien ne sert de courir, il faut partir à point.",
  "L'habitude devient vite une seconde nature.",
  "Chaque erreur corrigée rend la main plus sûre.",
  "Tu verras, dans quelques semaines, tout sera plus facile.",
  "Les lundis sont toujours plus longs que les vendredis.",
  "Le pain sort du four, il sent merveilleusement bon.",
  "Julien joue du piano chaque soir après le dîner.",
  "Quelle belle journée pour une promenade au bord du lac!",
  "Au printemps, les arbres se couvrent de fleurs.",
  "Le marché du samedi est plein de couleurs.",
  "Ils ont acheté une petite maison près de la mer.",
  "Un grand verre d'eau fraîche fait toujours du bien.",
  "Ce soir, nous dînons chez des amis.",
  "Le professeur écrit la date au tableau.",
  "Il y a vingt-quatre heures dans une journée.",
  "J'ai oublié mes clés sur la table de la cuisine.",
  "Ouvre doucement la porte pour ne pas réveiller le bébé.",
  "Sans effort, rien ne change, mais avec un peu de régularité, tout progresse.",
  "Les montagnes sont couvertes de neige jusqu'en juin.",
  "Il a fallu quelques essais pour trouver la bonne position.",
  "Nous attendons le bus depuis un quart d'heure.",
  "Mon frère travaille dans une grande entreprise.",
  "Une tasse de thé chaud, un bon livre et le silence.",
  "La rivière descend doucement vers la vallée.",
  "Les étoiles brillent dans le ciel de la nuit.",
  "Un sourire ne coûte rien et fait beaucoup de bien.",
  "Il paraît que demain sera une belle journée.",
  "Garde les yeux sur l'écran, tes doigts connaissent le chemin.",
  "La patience est la clé de tous les apprentissages.",
  "Aujourd'hui, j'ai tapé sans regarder mon clavier.",
  "Nous irons au cinéma samedi soir.",
  "La lune éclaire le chemin du retour.",
  "Il a posé les clés sur le bureau.",
  "Le bateau quitte le port à l'aube.",
  "Chaque matin, elle prend le train de six heures trente.",
  "Les oiseaux chantent dès les premières lueurs du jour.",
  "Un voyage de mille lieues commence par un pas.",
  "Je préfère les soirées calmes aux fêtes bruyantes.",
  "Voici un exercice court, mais très efficace.",
  "Portez ce vieux whisky au juge blond qui fume.",
  "Le zèbre jaloux fuit vers le grand lac gelé.",
  "Dès demain, je tape à dix doigts.",
  "Mon chat adore dormir près du radiateur.",
  "Les voisins ont décoré leur balcon avec des lumières.",
  "Quand on veut, on peut.",
  "L'union fait la force.",
  "Tout vient à point à qui sait attendre.",
  "Mieux vaut tard que jamais.",
  "Après la pluie, le beau temps.",
  "L'appétit vient en mangeant.",
  "Rome ne s'est pas faite en un jour.",
  "Les petits ruisseaux font les grandes rivières.",
  "Il n'y a pas de fumée sans feu.",
  "Un bon début fait déjà la moitié du chemin.",
  "Chaque doigt a sa place, chaque touche a son doigt.",
  "Le but n'est pas d'aller vite, mais d'aller juste.",
  "Fais une pause toutes les vingt minutes pour reposer tes mains.",
  "Elle écrit un long message à son amie.",
  "Le café du coin ouvre tôt le matin.",
];

const TEXTS_RAW = [
  "Apprendre à taper à dix doigts demande un peu de patience, mais le résultat en vaut la peine. Au début, chaque touche semble difficile à trouver. Puis, jour après jour, les doigts apprennent leur chemin et la main n'a plus besoin des yeux. Un matin, on s'aperçoit que l'on tape sans y penser.",
  "Le soleil se lève doucement sur la vallée. Une légère brume flotte au-dessus de la rivière, et les premiers oiseaux commencent à chanter. Dans le village, les volets s'ouvrent un à un. L'odeur du pain chaud monte de la boulangerie, et la journée peut commencer.",
  "La gare est pleine de monde en ce début de semaine. Les voyageurs se pressent vers les quais, un café à la main, le regard rivé sur le panneau des départs. Un haut-parleur annonce un léger retard. Personne ne semble s'en inquiéter vraiment : à cette heure, tout le monde a déjà l'esprit ailleurs.",
  "Pour préparer une bonne soupe de légumes, commencez par éplucher les carottes, les pommes de terre et un poireau. Faites revenir un oignon dans un peu de beurre, ajoutez les légumes, puis couvrez d'eau. Laissez cuire environ vingt minutes à feu doux avant de mixer le tout.",
  "Un clavier n'est qu'un outil, mais c'est celui que nous utilisons le plus. Chaque jour, nous y passons des heures sans vraiment y penser. Prendre le temps d'apprendre à s'en servir correctement, c'est gagner du confort et du temps pour tout le reste de sa vie.",
  "Le bateau avance lentement vers le large. Derrière lui, la côte devient une mince ligne grise, puis disparaît dans la brume. Le vent est frais, la mer est belle, et pendant quelques heures, plus rien n'existe que l'horizon, le bruit des vagues et le cri lointain des mouettes.",
  "Dans la vieille bibliothèque, le silence est presque tangible. Les étagères montent jusqu'au plafond, chargées de livres aux couvertures usées. Une lampe verte éclaire un bureau en bois où quelqu'un a laissé un carnet ouvert. On devine qu'une histoire s'écrit ici, ligne après ligne.",
  "Courir le matin n'est pas facile au début. Les jambes sont lourdes, le souffle court et l'envie de rester au lit très forte. Mais après quelques semaines, le corps s'habitue et l'on se surprend à attendre ce moment. Comme pour le clavier, tout est une question de régularité.",
];

const NAMES_RAW = "Paul Marie Hugo Emma Louis Jade Lucas Chloé Gabriel Léa Arthur Alice Jules Manon Nathan Sarah Théo Inès Adam Lola Noé Zoé Rose Victor Clara Simon Julie Maxime Camille Louise Antoine Elsa Romain Anna Clément Eva";
const CITIES_RAW = "Paris Lyon Marseille Toulouse Nice Nantes Strasbourg Montpellier Bordeaux Lille Rennes Reims Dijon Tours Metz Brest Caen Lorient Angers Grenoble Limoges Amiens Orléans Besançon Nîmes Avignon Perpignan Nancy Rouen";
const BIGRAMS_RAW = "es en re er on nt de te le ou ai an se it ur ti me ra ie ne ar la al ns ss ll ch qu ui tr pr st pa ma ec ep em ed co ro or ce eu is";
const TRIGRAMS_RAW = "ent ion que les ous ant tre des ait ons eur ell ais our par pas ier ont com con pro ver";
