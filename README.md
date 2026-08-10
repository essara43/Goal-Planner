# Goal Planner

Suivi d'objectifs par domaine de vie, inspiré d'un template Excel. Chaque objectif porte
sa raison d'être, son critère de réussite, sa récompense, son échéance et ses étapes ;
l'app en tire un avancement, un tableau de bord et une liste des échéances qui approchent.

**Tout reste sur ta machine.** Aucun backend, aucune API externe, aucun compte : les données
vivent dans le `localStorage` du navigateur, et l'export JSON est le seul moyen de les sortir
de là.

## Stack

| | |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript (mode `strict`) |
| Styles | Tailwind CSS 4, palette reprise du Budget Planner |
| Persistance | `localStorage` + import/export JSON |
| Tests | Vitest 4 + React Testing Library |
| Desktop | PWA installable (`vite-plugin-pwa`) |

Aucune dépendance runtime en dehors de React.

## Installation

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script | Effet |
|---|---|
| `npm run dev` | serveur de développement avec rechargement à chaud |
| `npm run build` | vérification TypeScript (`tsc --noEmit`) puis build de production dans `dist/` |
| `npm run preview` | sert le build de production sur http://localhost:4173 |
| `npm run test` | suite de tests, une passe |
| `npm run test:watch` | tests en mode surveillance |
| `VITE_BASE=/Goal-Planner/ npm run build` | build tel que produit par la CI pour GitHub Pages |
| `node scripts/generate-icons.mjs` | régénère les icônes PNG de la PWA |

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push sur
`main`. Il lance les tests avant le build : une suite rouge bloque le déploiement.

La **source Pages doit être réglée sur « GitHub Actions »** (Settings → Pages → Source).
Le réglage « Deploy from a branch » servirait la racine du dépôt — c'est-à-dire les sources
et non le build — et afficherait une page blanche.

Le site est servi depuis un sous-dossier portant le nom du dépôt, d'où la variable
`VITE_BASE=/Goal-Planner/` passée au build en CI. En local, `base` reste `/` et rien ne change.

## Installer l'app sur le Dock (macOS)

Le plus simple : ouvrir <https://essara43.github.io/Goal-Planner/> puis

- **Chrome / Edge** (recommandé) : icône d'installation dans la barre d'adresse, ou
  menu ⋮ → *Caster, enregistrer et partager* → *Installer la page en tant qu'application*.
- **Safari 17+** : *Fichier* → *Ajouter au Dock*.

Sans passer par GitHub Pages, un serveur local fait aussi l'affaire — une PWA a besoin d'un
contexte sécurisé, et `localhost` en est un :

```bash
npm run build && npm run preview   # http://localhost:4173
```

Une fois installée, l'app se lance depuis le Dock et fonctionne hors ligne : le service
worker sert l'app shell depuis le cache, sans réseau.

### Ce qu'il faut savoir avant de s'y installer pour de bon

- **Publier sur Pages rend l'app publique, pas les données.** N'importe qui peut ouvrir
  l'URL, mais il n'y verra que son propre `localStorage`, vide. Rien n'est jamais envoyé
  à un serveur.
- **L'installation repose sur un cache, pas sur un binaire.** Vider les données de site du
  navigateur désinstalle l'app *et* efface les objectifs. Exporte régulièrement.
- **Chaque navigateur a son propre stockage**, et l'app installée depuis Safari a même un
  conteneur distinct de l'onglet Safari. Les objectifs ne circulent pas entre eux : choisis
  un navigateur d'installation, ou migre via export/import JSON.
- **Une app installée depuis `localhost` et une app installée depuis GitHub Pages sont deux
  origines différentes**, donc deux stockages distincts. Même remarque : export/import.
- **Pas de synchronisation entre appareils.** C'est le prix du « 100 % local ».
- Après un nouveau déploiement, le service worker se met à jour tout seul au lancement
  suivant (`registerType: 'autoUpdate'`).

## Structure

```
src/
├── domain/       logique métier pure, sans React ni accès au stockage
│   ├── types.ts          Goal, Step, GoalStatus, LifeAreaId
│   ├── areas.ts          les 10 domaines de vie (énumération figée)
│   ├── goals.ts          progression, échéances, filtres, tris
│   ├── steps.ts          opérations sur les étapes
│   ├── factory.ts        création et mise à jour d'un objectif
│   ├── dashboard.ts      agrégats du tableau de bord
│   └── serialization.ts  export JSON et import validé
├── storage/      lecture/écriture localStorage
├── hooks/        useGoals : useReducer + persistance
├── components/   briques d'interface réutilisables
├── pages/        les quatre écrans
└── lib/          formatage d'affichage, génération d'identifiants
```

Le domaine ne connaît ni React ni `localStorage` : il ne manipule que des données et des
dates injectées. C'est ce qui rend ses 90+ tests rapides et sans DOM.

## Modèle de données

```ts
interface Goal {
  id: string;                 // uuid
  title: string;              // "What do you want to achieve?"
  area: LifeAreaId;           // slug parmi 10 domaines de vie
  why: string;                // "Why is this goal important?"
  successCriteria: string;    // "How do you measure success?"
  reward: string;
  deadline?: string;          // 'YYYY-MM-DD', optionnelle
  status: 'not_started' | 'in_progress' | 'achieved';
  steps: { id: string; label: string; done: boolean }[];
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
}
```

Les domaines de vie sont stockés sous forme de slugs (`health_fitness`, `career_growth`, …)
et non de libellés : renommer un libellé n'invalide donc ni les données ni les exports.

Format du fichier stocké et exporté, identique :

```json
{ "version": 1, "goals": [ /* Goal[] */ ] }
```

Clé de stockage : `goal-planner:v1`.

## Règles métier

- **Avancement** = étapes cochées / total. Un objectif sans étape est à 0 %.
- **Jours restants** = échéance − aujourd'hui, en jours entiers. Négatif = en retard, signalé
  par un badge rouge. Un objectif atteint n'est jamais marqué en retard.
- **Statut automatique** : cocher la dernière étape passe l'objectif à *Atteint* ; décocher une
  étape d'un objectif atteint le repasse à *En cours*. Ce recalcul ne se déclenche **que**
  lorsque les cases cochées changent — un statut choisi à la main survit à toute autre
  modification, y compris à un simple réordonnancement des étapes.
- **Échéances proches** : moins de 30 jours, retards inclus et affichés en tête, objectifs
  atteints exclus.
- **Aucune limite de nombre d'objectifs** (la limite de 15 était une contrainte du template
  Excel, pas du besoin).

## Choix techniques et leurs limites

**Pas de routeur.** L'app tient en quatre écrans ; la navigation est un simple état React.
*Limite* : pas d'URL par écran, pas de lien profond, et le bouton « retour » du navigateur ne
remonte pas d'un écran. Passer à `react-router` reste possible sans toucher au domaine.

**Pas de librairie de state management.** `useReducer` dans un hook `useGoals` qui encapsule
toute la persistance : aucun composant ne touche au `localStorage`. *Limite* : tout l'état
transite par `App`, ce qui deviendrait pénible bien au-delà de quatre écrans.

**Validation d'import écrite à la main**, sans `zod`. Une soixantaine de lignes, zéro
dépendance, des messages d'erreur en français pointant le champ fautif. *Limite* : à maintenir
à la main si le modèle évolue — et le champ `version` est là pour ça.

**Import tout ou rien.** Un seul objectif invalide fait échouer le fichier entier plutôt que
d'importer un jeu partiel en silence. *Limite* : un export légèrement abîmé est rejeté en bloc ;
il faut le corriger à la main.

**Import destructif.** Un import valide *remplace* les données existantes, il ne fusionne pas.
C'est le comportement d'une restauration de sauvegarde. L'écran Paramètres le dit avant l'action.

**Écriture localStorage à chaque changement d'état**, via un `useEffect`. Simple et suffisant
à cette échelle. *Limite* : un quota dépassé ou un stockage refusé (navigation privée) est
seulement journalisé en console — l'app continue en mémoire pour la session, sans alerte visible.

**Tailwind 4 en configuration CSS-first** : ni `tailwind.config.js` ni `postcss.config.js`,
tout passe par `@tailwindcss/vite` et `src/index.css`.

**Palette reprise de l'app Budget Planner** ([essara43/budget](https://github.com/essara43/budget)),
définie une fois comme tokens Tailwind dans `src/index.css` : `page`, `surface`, `line`, `ink`,
`accent`… Les composants n'écrivent jamais une couleur en dur, ce qui rend un futur changement de
palette local à ce fichier. Thème unique, sans variante ni bascule.

Deux écarts assumés par rapport aux tokens d'origine, pour la lisibilité :

| Rôle | Budget Planner | Ici | Pourquoi |
|---|---|---|---|
| Texte secondaire | `#c087a4` | `#9c5c7c` | 2,6:1 sur le fond rose, sous le seuil AA (4,5:1) ; le nouveau ton donne 4,5:1 |
| Fond des boutons pleins | `#ff85b3` | `#c92f70` | du blanc sur `#ff85b3` ne donne que 2,3:1 ; sur `#c92f70`, 5,1:1 |

Le rose `#ff85b3` d'origine reste utilisé partout où il ne sert pas de fond à du texte : barres
de progression, bordures au survol, titre de l'en-tête. *Limite* : les boutons pleins sont donc
un cran plus soutenus que dans le Budget Planner.

Non repris, faute d'être demandé : le rayon de 18 px, les bordures de 2 px et la pile de polices
(qui place `Comic Sans MS` avant `Quicksand`).

**Libellés bilingues assumés.** Les cinq questions de la fiche objectif gardent la formulation
anglaise du template Excel d'origine (*What do you want to achieve?*, *Steps to reach goal*, …),
de même que les noms des domaines de vie ; le reste de l'interface est en français.

## Tests

```bash
npm run test
```

106 tests. L'essentiel porte sur les fonctions pures du domaine — avancement à 0 étape,
échéance absente, passée ou traversant un changement d'heure, agrégats sur liste vide,
frontière des 30 jours, données corrompues à l'import (JSON invalide, racine inattendue,
domaine inconnu, étapes malformées, identifiants en double). Une poignée de tests React
Testing Library couvre les parcours complets : créer, filtrer, cocher, supprimer, importer,
réinitialiser.

## Licence

MIT.
