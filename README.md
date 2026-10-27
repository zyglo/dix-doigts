# Dix Doigts

Apprendre à taper au clavier avec les dix doigts, en français, quand on a toujours tapé avec deux index.

**Ouvrir l'application : https://zyglo.github.io/dix-doigts/**

Gratuit, sans compte, sans publicité. La progression reste sur l'appareil, et l'application marche aussi sans internet une fois ouverte.

## Ce qu'il y a dedans

- **31 leçons** (29 en QWERTY) : rangée de base, rangée du haut, rangée du bas, majuscules, ponctuation, accents, chiffres, puis vitesse et fluidité.
- **Des exercices générés à chaque essai** : touches seules, alternances, syllabes, mots, phrases, textes.
- **Un clavier à l'écran** qui montre la touche et le doigt à utiliser.
- **Un entraînement libre**, des tests de vitesse avec des rangs (Bronze à Diamant), et un jeu, « Pluie de mots ».
- **Des statistiques** : touches les plus ratées, carte de chaleur, régularité.
- **Trois claviers** : AZERTY français, AZERTY belge (« Belge virgule » ou « Belge point », et la plupart des Mac en français) et QWERTY américain. Le site reconnaît le clavier quand on appuie sur la touche 8.
- **Sauvegarde dans un fichier**, pour passer ses progrès d'un appareil à l'autre.

## L'installer comme une application

| Appareil | Comment faire |
|---|---|
| iPhone, iPad | Ouvrir le lien dans Safari, bouton Partager, puis « Sur l'écran d'accueil ». |
| Android | Ouvrir le lien dans Chrome, puis « Installer l'application » (ou menu ⋮ › « Ajouter à l'écran d'accueil »). |
| Windows, Chromebook, Linux | Ouvrir le lien dans Chrome ou Edge, puis l'icône d'installation à droite de la barre d'adresse. |
| Mac | Safari : menu Fichier › « Ajouter au Dock ». Chrome ou Edge : comme sous Windows. |

La méthode des dix doigts demande un vrai clavier. Sur une tablette, un clavier USB ou Bluetooth fait l'affaire. Sans clavier, les exercices marchent quand même avec le clavier de l'écran.

## Pour les développeurs

Le site n'a aucune dépendance : du JavaScript, du CSS et du HTML, assemblés par un petit script Node.

```bash
node site/build.js
```

Le script produit :

- `docs/` : l'application installable, publiée par GitHub Pages. Elle contient un service worker pour le mode hors ligne, le manifeste, les icônes et les polices.
- `site/dist/index.html` : la même chose en un seul fichier, à ouvrir directement dans un navigateur.

Organisation du code, dans `site/src`, assemblé dans l'ordre des numéros :

- `01-corpus.js` : mots, phrases et textes français.
- `02-lessons.js` : claviers (tables vérifiées contre celles de Windows), doigts, modules et leçons.
- `03-*.js` : stockage, générateurs d'exercices, reconnaissance du clavier, rangs, synchronisation.
- `04-ui.js` : clavier à l'écran, mains, moteur de frappe (clavier physique et clavier de l'écran).
- `05-pages-a.js`, `06-pages-b.js` : les pages.
- `06-app.js` : installation et mode hors ligne.
- `07-main.js` : navigation et démarrage.

Deux outils servent à préparer les fichiers de l'application, dans `site/tools` :

- `fetch-fonts.js` copie les polices pour qu'elles marchent hors ligne.
- `make-icons.js` dessine les icônes.

## Licence

Le code est sous licence [MIT](LICENSE). Les polices Bricolage Grotesque, IBM Plex Sans et IBM Plex Mono sont sous SIL Open Font License 1.1 (fichiers `OFL-*.txt`).

La moyenne de vitesse affichée à titre de repère vient de l'étude publique d'Aalto University et de l'université de Cambridge (2018) sur 168 000 volontaires.
